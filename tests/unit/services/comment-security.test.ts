import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { DB } from "@/db";
const mocks = vi.hoisted(() => ({ guard: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }));
import { createComment, updateComment, updateCommentStatus, bulkUpdateCommentStatus, bulkDeleteComments, deleteComment,
  getCommentById, getCommentsByPostId, listComments, syncPostCommentCount,
  addCommentMeta, getCommentMeta, updateCommentMeta, deleteCommentMeta, getThreadedCommentsByPostId,
} from "@/services/comment.service";
import { createCommentSchema, updateCommentSchema, commentIdsSchema, commentStatusSchema, commentIdSchema } from "@/db/schema/cms-comments";
// Script query responses while inspecting the actual Drizzle predicates. No
// connection to the application's configured PostgreSQL database is opened.
function databaseWith(selects: unknown[][], inserted: unknown[][] = []) {
  type QueryChain = {
    from: () => QueryChain;
    innerJoin: () => QueryChain;
    leftJoin: () => QueryChain;
    orderBy: () => QueryChain;
    offset: () => QueryChain;
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
        offset: () => chain,
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
        where: (condition: SQL) => {
          writes.push({ table, values, ...dialect.sqlToQuery(condition) });
          const pending = Promise.resolve([]);
          return { then: pending.then.bind(pending), returning: async () => [row] };
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


const input = { commentPostId: "2", commentAuthor: "Reader", commentAuthorEmail: "reader@example.com", commentContent: "A comment" };
const row = { commentId: BigInt(1), commentPostId: BigInt(2), commentParent: BigInt(0), commentAuthor: "Reader", commentAuthorEmail: "reader@example.com", commentAuthorUrl: "", commentAuthorIp: "", commentAgent: "", commentKarma: 0, commentContent: "A comment", commentApproved: "1", commentType: "comment", userId: "original-author", commentDate: new Date(), commentDateGmt: new Date() };
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } }); });
describe("comment security", () => {
  it("guards all mutation and private read services before database access", async () => {
    mocks.guard.mockRejectedValue(new Error("Forbidden"));
    const t = databaseWith([]);
    for (const operation of [
      () => createComment(input, t.database), () => updateComment("1", {}, t.database),
      () => updateCommentStatus("1", "spam", t.database), () => bulkUpdateCommentStatus(["1"], "1", t.database),
      () => bulkDeleteComments(["1"], t.database), () => deleteComment("1", t.database),
      () => syncPostCommentCount("2", t.database), () => getCommentById("1", t.database),
      () => getCommentsByPostId("2", {}, t.database), () => listComments({}, t.database),
      () => getThreadedCommentsByPostId("2", {}, t.database),
      () => addCommentMeta({ commentId: "1", metaKey: "key" }, t.database),
      () => getCommentMeta("1", undefined, t.database), () => updateCommentMeta("1", "key", "value", t.database),
      () => deleteCommentMeta("1", undefined, t.database),
    ]) await expect(operation()).rejects.toThrow("Forbidden");
    expect(t.tx.select).not.toHaveBeenCalled(); expect(t.transaction).not.toHaveBeenCalled(); expect(t.writes).toEqual([]);
  });
  it.each(["0", "-1", "bad", "9223372036854775808", Number.MAX_SAFE_INTEGER + 1])("rejects invalid IDs %s", id => {
    expect(commentIdSchema.safeParse(id).success).toBe(false);
  });
  it("bounds batches, text, statuses and safe author URLs", () => {
    expect(commentIdsSchema.safeParse(Array(101).fill("1")).success).toBe(false);
    expect(commentIdsSchema.parse(["1", "1"])).toEqual([BigInt(1)]);
    for (const url of ["javascript:alert(1)", "data:text/html,x", "file:///tmp/x", "//example.com", "https://user:pass@example.com"])
      expect(createCommentSchema.safeParse({ ...input, commentAuthorUrl: url }).success).toBe(false);
    expect(createCommentSchema.safeParse({ ...input, commentContent: "x".repeat(20001) }).success).toBe(false);
    expect(createCommentSchema.safeParse({ ...input, commentAuthor: "  " }).success).toBe(false);
    expect(commentStatusSchema.safeParse("publish").success).toBe(false);
    expect(commentStatusSchema.parse("pending")).toBe("0");
    expect(updateCommentSchema.parse({ commentContent: " Edited " })).toEqual({ commentContent: "Edited" });
  });
  it("strips internal attribution, dates, karma, IP and IDs from edits", () => {
    expect(updateCommentSchema.parse({ commentContent: "Edited", userId: "forged", commentId: "9", commentDate: new Date(), commentKarma: 999, commentAuthorIp: "forged", commentAgent: "forged" })).toEqual({ commentContent: "Edited" });
  });
  it("uses the authenticated admin identity when creating a comment", async () => {
    const t = databaseWith([[{ id: BigInt(2) }], [{ total: 1 }]], [[row]]);
    await createComment(input, t.database);
    expect(t.writes[0]).toMatchObject({ values: { userId: "admin", commentApproved: "0" } });
    expect(t.committed()).toBe(true);
    expect(t.writes[1]).toMatchObject({ values: { commentCount: BigInt(1) } });
  });
  it("rejects a comment on a missing or non-content post", async () => {
    const t = databaseWith([[]]);
    await expect(createComment(input, t.database)).rejects.toThrow("error.post");
    expect(t.writes).toEqual([]);
    expect(t.predicates[0].params).toEqual([BigInt(2), "post", "page"]);
  });
  it("rejects reply parents in another post", async () => {
    const t = databaseWith([[{ id: BigInt(2) }], [{ ...row, commentPostId: BigInt(3) }]]);
    await expect(createComment({ ...input, commentParent: "1" }, t.database)).rejects.toThrow("error.parent");
    expect(t.writes).toEqual([]);
  });
  it("rejects a circular reply edit", async () => {
    const t = databaseWith([[row], [{ id: BigInt(2) }]]);
    await expect(updateComment("1", { commentParent: BigInt(1) }, t.database)).rejects.toThrow("error.parent");
    expect(t.writes).toEqual([]);
  });
  it("refuses moving a comment with replies to another post", async () => {
    const t = databaseWith([[row], [{ id: BigInt(3) }], [{ id: BigInt(7) }]]);
    await expect(updateComment("1", { commentPostId: BigInt(3) }, t.database)).rejects.toThrow("error.parent");
    expect(t.writes).toEqual([]);
  });
  it("updates both old and new post counts when a comment moves", async () => {
    const t = databaseWith([[row], [{ id: BigInt(3) }], [], [{ total: 0 }], [{ total: 1 }]]);
    await updateComment("1", { commentPostId: BigInt(3) }, t.database);
    expect(t.writes).toHaveLength(3);
    expect(t.writes[1]).toMatchObject({ params: [BigInt(2)], values: { commentCount: BigInt(0) } });
    expect(t.writes[2]).toMatchObject({ params: [BigInt(3)], values: { commentCount: BigInt(1) } });
  });
  it("refuses invalid status values before touching the database", async () => {
    const t = databaseWith([]);
    await expect(bulkUpdateCommentStatus(["1"], "arbitrary", t.database)).rejects.toThrow();
    expect(t.transaction).not.toHaveBeenCalled();
  });
  it("rejects a mixed missing batch without partially moderating it", async () => {
    const t = databaseWith([[{ id: BigInt(1), postId: BigInt(2) }]]);
    await expect(bulkUpdateCommentStatus(["1", "7"], "spam", t.database)).rejects.toThrow("error.missing");
    expect(t.writes).toEqual([]); expect(t.committed()).toBe(false);
  });
  it("moderates a deduplicated batch and counts each affected post once", async () => {
    const t = databaseWith([[{ id: BigInt(1), postId: BigInt(2) }, { id: BigInt(3), postId: BigInt(2) }], [{ total: 0 }]]);
    expect(await bulkUpdateCommentStatus(["1", "1", "3"], "pending", t.database)).toEqual({ success: true, count: 2 });
    expect(t.writes).toHaveLength(2); expect(t.writes[0]).toMatchObject({ values: { commentApproved: "0" } });
    expect(t.committed()).toBe(true);
  });
  it("detaches surviving replies on permanent deletion", async () => {
    const t = databaseWith([[{ id: BigInt(1), postId: BigInt(2) }], [{ total: 0 }]]);
    expect(await bulkDeleteComments(["1"], t.database)).toEqual({ success: true, count: 1 });
    expect(t.writes[0]).toMatchObject({ values: { commentParent: BigInt(0) } });
    expect(t.writes).toHaveLength(3); expect(t.committed()).toBe(true);
  });
  it("does not commit moderation if count synchronization fails", async () => {
    const t = databaseWith([[{ id: BigInt(1), postId: BigInt(2) }]]);
    await expect(bulkUpdateCommentStatus(["1"], "spam", t.database)).rejects.toThrow("Unexpected query");
    expect(t.committed()).toBe(false);
  });
  it("handles imported cyclic reply threads without creating a cyclic result", async () => {
    const t = databaseWith([[{ ...row, commentParent: BigInt(3) }, { ...row, commentId: BigInt(3), commentParent: BigInt(1) }]]);
    const result = await getThreadedCommentsByPostId("2", {}, t.database);
    expect(result).toHaveLength(2);
    expect(() => JSON.stringify(result, (_, value) => typeof value === "bigint" ? String(value) : value)).not.toThrow();
  });
});
