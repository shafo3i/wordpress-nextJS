import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { DB } from "@/db";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), language: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: mocks.guard }));
vi.mock("@/services/language.service", () => ({
  setTermLanguage: mocks.language,
}));
import {
  createCategory,
  updateCategory,
  quickUpdateCategory,
  bulkDeleteCategories,
  uniqueCategorySlug,
} from "@/services/category.service";
import {
  createCategorySchema,
  quickUpdateCategorySchema,
  deleteCategoriesSchema,
  categoryIdSchema,
} from "@/db/schema/cms-taxonomy";

// Script query responses while inspecting the actual Drizzle predicates. No
// connection to the application's configured PostgreSQL database is opened.
function databaseWith(selects: unknown[][], inserted: unknown[][] = []) {
  type QueryChain = {
    from: () => QueryChain;
    innerJoin: () => QueryChain;
    leftJoin: () => QueryChain;
    orderBy: () => QueryChain;
    limit: () => QueryChain;
    where: (condition: SQL) => QueryChain;
    then: Promise<unknown[]>["then"];
  };
  const predicates: { sql: string; params: unknown[] }[] = [];
  const writes: unknown[] = [];
  const dialect = new PgDialect();
  const tx = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => {
      const rows = selects.shift();
      if (!rows) throw new Error("Unexpected query");
      const pending = Promise.resolve(rows);
      const chain: QueryChain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        orderBy: () => chain,
        limit: () => chain,
        where: (condition: SQL) => {
          predicates.push(dialect.sqlToQuery(condition));
          return chain;
        },
        then: pending.then.bind(pending),
      };
      return chain;
    }),
    insert: vi.fn((table) => ({
      values: (values: unknown) => ({
        returning: async () => {
          writes.push({ table, values });
          return inserted.shift() || [];
        },
      }),
    })),
    update: vi.fn((table) => ({
      set: (values: unknown) => ({
        where: async (condition: SQL) => {
          writes.push({ table, values, ...dialect.sqlToQuery(condition) });
        },
      }),
    })),
    delete: vi.fn((table) => ({
      where: async (condition: SQL) => {
        writes.push({ table, ...dialect.sqlToQuery(condition) });
      },
    })),
  };
  let committed = false;
  const transaction = vi.fn(async (callback: (value: typeof tx) => unknown) => {
    const result = await callback(tx);
    committed = true;
    return result;
  });
  return {
    database: { ...tx, transaction } as unknown as DB,
    tx,
    predicates,
    writes,
    transaction,
    committed: () => committed,
  };
}
const category = {
  termId: BigInt(1),
  termTaxonomyId: BigInt(10),
  name: "News",
  slug: "news",
  description: "",
  parent: BigInt(0),
  count: BigInt(0),
  languageCode: "en",
  translationGroupId: null,
};
const hierarchy = [
  { termId: BigInt(1), taxId: BigInt(10), parent: BigInt(0) },
  { termId: BigInt(2), taxId: BigInt(20), parent: BigInt(1) },
];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue({ user: { role: "editor" } });
  mocks.language.mockResolvedValue("group");
});

describe("category mutation security", () => {
  it("checks authorization before every mutation touches the database", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    const test = databaseWith([]);
    for (const operation of [
      () => createCategory({ name: "News" }, test.database),
      () => updateCategory("1", { name: "News" }, test.database),
      () => quickUpdateCategory("1", { name: "News" }, test.database),
      () => bulkDeleteCategories(["1"], test.database),
    ]) {
      await expect(operation()).rejects.toThrow("Forbidden");
    }
    expect(test.transaction).not.toHaveBeenCalled();
    expect(test.tx.select).not.toHaveBeenCalled();
  });
  it.each(["bad", "0", "-1", "9223372036854775808"])(
    "rejects malformed mutation ID %s",
    async (id) => {
      const test = databaseWith([]);
      await expect(
        quickUpdateCategory(id, { name: "News" }, test.database)
      ).rejects.toThrow();
      await expect(bulkDeleteCategories([id], test.database)).rejects.toThrow();
      expect(test.transaction).not.toHaveBeenCalled();
    }
  );
  it.each(["update", "quick"])(
    "does not %s a supplied tag/non-category ID",
    async (operation) => {
      const test = databaseWith([[]]);
      await expect(
        operation === "quick"
          ? quickUpdateCategory("1", { name: "Changed" }, test.database)
          : updateCategory("1", { name: "Changed" }, test.database)
      ).rejects.toThrow("not_found");
      expect(test.predicates[0].sql).toContain('"taxonomy"');
      expect(test.predicates[0].params).toContain("category");
      expect(test.predicates[0].params).toContain(BigInt(1));
      expect(test.writes).toEqual([]);
    }
  );
  it("rejects the entire delete batch when one ID is not a category", async () => {
    const test = databaseWith([[category]]);
    await expect(
      bulkDeleteCategories(["1", "2"], test.database)
    ).rejects.toThrow("not_found");
    expect(test.predicates[0].params).toEqual([
      "category",
      BigInt(1),
      BigInt(2),
    ]);
    expect(test.writes).toEqual([]);
  });
  it("protects the default category and shared terms", async () => {
    const defaultTest = databaseWith([
      [{ ...category, slug: "uncategorized" }],
    ]);
    await expect(
      bulkDeleteCategories(["1"], defaultTest.database)
    ).rejects.toThrow("default");
    const shared = databaseWith([[category], [{ id: BigInt(1) }]]);
    await expect(bulkDeleteCategories(["1"], shared.database)).rejects.toThrow(
      "shared"
    );
    expect(defaultTest.writes).toEqual([]);
    expect(shared.writes).toEqual([]);
  });
  it("rejects shared-term quick edits before changing the term", async () => {
    const test = databaseWith([
      [category],
      [{ count: 0 }],
      [{ id: BigInt(1) }],
    ]);
    await expect(
      quickUpdateCategory("1", { name: "Changed" }, test.database)
    ).rejects.toThrow("shared");
    expect(test.writes).toEqual([]);
  });
  it("allows a valid quick edit but preserves the default category slug", async () => {
    for (const slug of ["news", "uncategorized"]) {
      const test = databaseWith([
        [{ ...category, slug }],
        [{ count: 0 }],
        [],
        ...(slug === "news" ? [[]] : []),
      ]);
      const result = await quickUpdateCategory(
        "1",
        { name: "Updated", slug: "updated" },
        test.database
      );
      expect(result).toEqual({
        id: "1",
        name: "Updated",
        slug: slug === "uncategorized" ? slug : "updated",
      });
      expect(test.writes).toHaveLength(1);
      expect(test.committed()).toBe(true);
    }
  });
  it("deletes verified categories once and reparents surviving children", async () => {
    const test = databaseWith([[category], []]);
    expect(await bulkDeleteCategories(["1", "1"], test.database)).toEqual({
      success: true,
      count: 1,
    });
    expect(test.writes).toHaveLength(4);
    expect(test.writes[2]).toMatchObject({
      values: { parent: BigInt(0) },
      params: ["category", BigInt(1)],
    });
    expect(test.committed()).toBe(true);
  });
  it.each(["1", "2", "999"])(
    "rejects self, descendant or nonexistent parent %s",
    async (parent) => {
      const test = databaseWith([[category], [{ count: 0 }], [], hierarchy]);
      await expect(
        updateCategory("1", { parent }, test.database)
      ).rejects.toThrow("parent");
      expect(test.writes).toEqual([]);
    }
  );
  it("rejects inactive/missing languages before writing", async () => {
    const test = databaseWith([hierarchy, []]);
    await expect(
      createCategory({ name: "News", languageCode: "zz" }, test.database)
    ).rejects.toThrow("language");
    expect(test.writes).toEqual([]);
  });
  it("rejects translation links to a non-category or to the same language", async () => {
    const missing = databaseWith([hierarchy, [{ code: "ar" }]]);
    await expect(
      createCategory(
        { name: "News", languageCode: "ar", sourceTermTaxonomyId: "99" },
        missing.database
      )
    ).rejects.toThrow("translation");
    const same = databaseWith([
      hierarchy,
      [{ code: "en" }],
      [{ taxId: BigInt(10), locale: "en", group: "group" }],
    ]);
    await expect(
      createCategory(
        { name: "News", languageCode: "en", sourceTermTaxonomyId: "10" },
        same.database
      )
    ).rejects.toThrow("translation");
    expect(missing.writes).toEqual([]);
    expect(same.writes).toEqual([]);
  });
  it("does not commit category creation when its language write fails", async () => {
    const test = databaseWith(
      [hierarchy, [{ code: "en" }], []],
      [[{ termId: BigInt(3) }], [{ termTaxonomyId: BigInt(30) }]]
    );
    mocks.language.mockRejectedValue(new Error("Language failure"));
    await expect(
      createCategory({ name: "New category" }, test.database)
    ).rejects.toThrow("Language failure");
    expect(mocks.language).toHaveBeenCalledWith(
      BigInt(30),
      "en",
      undefined,
      test.tx
    );
    expect(test.committed()).toBe(false);
  });
  it("creates a category with the default language in the same transaction", async () => {
    const test = databaseWith(
      [hierarchy, [{ code: "en" }], [], [category], [{ count: 0 }]],
      [[{ termId: BigInt(1) }], [{ termTaxonomyId: BigInt(10) }]]
    );
    expect((await createCategory({ name: " News " }, test.database)).id).toBe(
      "1"
    );
    expect(mocks.language).toHaveBeenCalledWith(
      BigInt(10),
      "en",
      undefined,
      test.tx
    );
    expect(test.committed()).toBe(true);
  });
  it("does not reset omitted slug, parent or description fields on update", async () => {
    const existing = { ...category, description: "Keep this description" };
    const test = databaseWith([
      [existing],
      [{ count: 0 }],
      [],
      hierarchy,
      [{ code: "en" }],
      [],
      [existing],
      [{ count: 0 }],
    ]);
    await updateCategory(
      "1",
      { description: "Changed description" },
      test.database
    );
    expect(test.writes[0]).toMatchObject({
      values: { name: "News", slug: "news" },
    });
    expect(test.writes[1]).toMatchObject({
      values: { description: "Changed description", parent: BigInt(0) },
    });
    expect(test.committed()).toBe(true);
  });
  it("rejects a translation group already containing the target language", async () => {
    const test = databaseWith([
      hierarchy,
      [{ code: "ar" }],
      [
        { taxId: BigInt(10), locale: "en", group: "group" },
        { taxId: BigInt(20), locale: "ar", group: "group" },
      ],
    ]);
    await expect(
      createCategory(
        { name: "News", languageCode: "ar", sourceTermTaxonomyId: "10" },
        test.database
      )
    ).rejects.toThrow("translation");
    expect(test.writes).toEqual([]);
  });
  it("rejects linking a category to itself", async () => {
    const test = databaseWith([
      [category],
      [{ count: 0 }],
      [],
      hierarchy,
      [{ code: "en" }],
    ]);
    await expect(
      updateCategory("1", { sourceTermTaxonomyId: "10" }, test.database)
    ).rejects.toThrow("translation");
    expect(test.writes).toEqual([]);
  });
  it("keeps a collision suffix within the slug limit", async () => {
    const test = databaseWith([[{ id: BigInt(1) }], []]);
    expect(
      await uniqueCategorySlug("a".repeat(200), undefined, test.database)
    ).toBe("a".repeat(198) + "-2");
  });
});
describe("category runtime schemas", () => {
  it("validates every field rather than trusting TypeScript annotations", () => {
    for (const value of [true, null, "1.5", Number.MAX_SAFE_INTEGER + 1])
      expect(categoryIdSchema.safeParse(value).success).toBe(false);
    for (const patch of [
      { name: " " },
      { name: "a".repeat(201) },
      { parent: "-1" },
      { languageCode: "../../" },
      { sourceTermTaxonomyId: "tag" },
      { description: "x".repeat(20001) },
    ])
      expect(
        createCategorySchema.safeParse({ name: "News", ...patch }).success
      ).toBe(false);
    expect(
      quickUpdateCategorySchema.safeParse({ id: "1", name: "a".repeat(201) })
        .success
    ).toBe(false);
    expect(deleteCategoriesSchema.safeParse(Array(101).fill("1")).success).toBe(
      false
    );
    expect(deleteCategoriesSchema.safeParse([]).success).toBe(false);
  });
});
