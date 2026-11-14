import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { DB } from "@/db";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), language: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: mocks.guard }));
vi.mock("@/services/language.service", () => ({ setTermLanguage: mocks.language }));
import { createTag, updateTag, quickUpdateTag, bulkDeleteTags, uniqueTagSlug, syncTagCount } from "@/services/tag.service";
import { createTagSchema, updateTagSchema, deleteTagsSchema } from "@/db/schema/cms-taxonomy";
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

beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { role: "editor" } }); });
describe("tag security", () => {
  it("authorizes all mutations before database access", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    const test = databaseWith([]);
    for (const operation of [
      () => createTag({ name: "News" }, test.database),
      () => updateTag("1", { name: "News" }, test.database),
      () => quickUpdateTag("1", { name: "News" }, test.database),
      () => bulkDeleteTags(["1"], test.database),
      () => syncTagCount("1", test.database),
    ]) await expect(operation()).rejects.toThrow("Forbidden");
    expect(test.tx.select).not.toHaveBeenCalled();
    expect(test.transaction).not.toHaveBeenCalled();
  });
  it.each(["bad", "0", "-1", "9223372036854775808"])("rejects invalid IDs %s", async id => {
    const test = databaseWith([]);
    await expect(quickUpdateTag(id, { name: "News" }, test.database)).rejects.toThrow();
    await expect(bulkDeleteTags([id], test.database)).rejects.toThrow();
    expect(test.transaction).not.toHaveBeenCalled();
  });
  it("rejects blank names, oversized descriptions and bulk requests", () => {
    expect(createTagSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createTagSchema.safeParse({ name: "News", description: "x".repeat(20001) }).success).toBe(false);
    expect(deleteTagsSchema.safeParse(Array(101).fill("1")).success).toBe(false);
    expect(deleteTagsSchema.parse(["1", "1"])).toEqual([BigInt(1)]);
    expect(updateTagSchema.parse({ termId: "1", name: " News " })).toEqual({ termId: BigInt(1), name: "News" });
  });
  it("does not quick-edit a category ID", async () => {
    const test = databaseWith([[]]);
    await expect(quickUpdateTag("8", { name: "Changed" }, test.database)).rejects.toThrow("missing");
    expect(test.predicates[0].params).toContain("post_tag");
    expect(test.writes).toEqual([]);
  });
  it("refuses deleting shared taxonomy terms", async () => {
    const test = databaseWith([[{ id: BigInt(8) }]]);
    await expect(bulkDeleteTags(["8"], test.database)).rejects.toThrow("shared");
    expect(test.writes).toEqual([]);
    expect(test.committed()).toBe(false);
  });
  it("does not delete unmatched term IDs or report them as removed", async () => {
    const test = databaseWith([[], []]);
    expect(await bulkDeleteTags(["8"], test.database)).toEqual({ success: true, count: 0 });
    expect(test.writes).toEqual([]);
    expect(test.predicates[1].params).toContain("post_tag");
  });
  it("deletes only matched tags and their relationships", async () => {
    const test = databaseWith([[], [{ termId: BigInt(1), termTaxonomyId: BigInt(10) }]]);
    expect(await bulkDeleteTags(["1", "9"], test.database)).toEqual({ success: true, count: 1 });
    expect(test.writes).toHaveLength(3);
    expect(test.writes[2]).toMatchObject({ params: [BigInt(1)] });
  });
  it("preserves a suffix on a maximum length slug collision", async () => {
    const test = databaseWith([[{ id: BigInt(1) }], []]);
    const slug = await uniqueTagSlug("a".repeat(200), undefined, test.database);
    expect(slug).toHaveLength(200);
    expect(slug.endsWith("-2")).toBe(true);
  });
  it("creates a tag with the active default language inside the transaction", async () => {
    const row = { termId: BigInt(1), termTaxonomyId: BigInt(10), name: "News", slug: "news", description: "", count: BigInt(0), languageCode: "ar", translationGroupId: null };
    const test = databaseWith([[], [{ code: "ar" }], [], [row], [{ count: 0 }]], [[{ termId: BigInt(1) }], [{ id: BigInt(10) }]]);
    const result = await createTag({ name: "News" }, test.database);
    expect(result).toMatchObject({ id: "1", languageCode: "ar" });
    expect(mocks.language).toHaveBeenCalledWith(BigInt(10), "ar", undefined, expect.anything());
    expect(test.committed()).toBe(true);
  });
  it("rolls back creation when saving its language fails", async () => {
    mocks.language.mockRejectedValueOnce(new Error("language write failed"));
    const test = databaseWith([[], [{ code: "ar" }], []], [[{ termId: BigInt(1) }], [{ id: BigInt(10) }]]);
    await expect(createTag({ name: "News" }, test.database)).rejects.toThrow("language write failed");
    expect(test.committed()).toBe(false);
  });
  it("rejects an occupied target language in a translation group", async () => {
    const test = databaseWith([[{ taxId: BigInt(7) }], [{ code: "ar" }], [
      { taxId: BigInt(7), locale: "en", group: "g" },
      { taxId: BigInt(8), locale: "ar", group: "g" },
    ]]);
    await expect(createTag({ name: "News", languageCode: "ar", sourceTermTaxonomyId: "7" }, test.database)).rejects.toThrow("translation");
    expect(test.writes).toEqual([]);
  });
  it("rejects inactive languages before creating a term", async () => {
    const test = databaseWith([[], []]);
    await expect(createTag({ name: "News", languageCode: "xx" }, test.database)).rejects.toThrow("language");
    expect(test.writes).toEqual([]);
  });
  it("rejects category translation sources", async () => {
    const test = databaseWith([[], [{ code: "ar" }]]);
    await expect(createTag({ name: "News", languageCode: "ar", sourceTermTaxonomyId: "7" }, test.database)).rejects.toThrow("translation");
    expect(test.writes).toEqual([]);
    expect(mocks.language).not.toHaveBeenCalled();
  });
});
