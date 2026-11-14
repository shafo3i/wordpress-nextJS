import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import type { DB } from "@/db";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), editor: vi.fn() }));
vi.mock("server-only", () => ({})); vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.admin, verifyPostEditor: mocks.editor }));
import { createLanguage, updateLanguage, deleteLanguage, setDefaultLanguage, saveTranslation, saveTranslationsBatch, deleteTranslationOverride,
  getDbTranslations, getPostTranslations, linkPostTranslation, linkTermTranslation, setPostLanguage, setTermLanguage, getTranslationCatalog,
} from "@/services/language.service";
import { syncMissingTranslations } from "@/services/language-sync.service";
import { languageCodeSchema, updateLanguageSchema, translationBatchSchema, translationReturnUrlSchema } from "@/db/schema/cms-languages";
function databaseWith(responses: unknown[][] = []) {
 const writes: { values?: unknown; sql?: string; params?: unknown[] }[] = [];
 const predicates: { sql: string; params: unknown[] }[] = [];
 const dialect = new PgDialect(); let committed = false;
 const tx = {
  execute: vi.fn().mockResolvedValue(undefined),
  select: vi.fn(() => {
   const rows = responses.shift(); if (!rows) throw Error("Unexpected query");
   const promise = Promise.resolve(rows);
   const chain = { from: () => chain, innerJoin: () => chain, where: (value: SQL) => { predicates.push(dialect.sqlToQuery(value)); return chain; }, limit: () => chain, orderBy: () => chain, then: promise.then.bind(promise) };
   return chain;
  }),
  insert: vi.fn(() => ({ values: (value: unknown) => {
   writes.push({ values: value });
   const promise = Promise.resolve(); const chain = { onConflictDoUpdate: () => chain, returning: async () => [value], then: promise.then.bind(promise) }; return chain;
  } })),
  update: vi.fn(() => ({ set: (value: unknown) => {
   const write: typeof writes[number] = { values: value }; writes.push(write);
   const promise = Promise.resolve(); const chain = { where: (condition: SQL) => { Object.assign(write, dialect.sqlToQuery(condition)); return chain; }, returning: async () => [value], then: promise.then.bind(promise) }; return chain;
  } })),
  delete: vi.fn(() => ({ where: async (condition: SQL) => { writes.push(dialect.sqlToQuery(condition)); } })),
  transaction: vi.fn(async (work: (tx: unknown) => unknown): Promise<unknown> => { const result = await work(tx); committed = true; return result; }),
 };
 return { database: tx as unknown as DB, tx, writes, predicates, committed: () => committed };
}
beforeEach(() => { vi.clearAllMocks(); mocks.admin.mockResolvedValue({ user: { role: "admin", id: "admin" } }); mocks.editor.mockResolvedValue({ user: { role: "admin", id: "admin" } }); });
describe("language security", () => {
 it("guards administration, synchronization and catalog access before touching the database", async () => {
  mocks.admin.mockRejectedValue(Error("Forbidden")); const t = databaseWith();
  for (const run of [() => createLanguage({ code: "de", name: "German" }, t.database), () => updateLanguage("de", {}, t.database), () => deleteLanguage("de", t.database), () => setDefaultLanguage("de", t.database), () => saveTranslation("de", "site.test", "Test", t.database), () => saveTranslationsBatch("de", {}, t.database), () => deleteTranslationOverride("de", "site.test", t.database), () => syncMissingTranslations(t.database), () => getTranslationCatalog("de", {}, t.database)]) await expect(run()).rejects.toThrow("Forbidden");
  expect(t.tx.select).not.toHaveBeenCalled(); expect(t.tx.transaction).not.toHaveBeenCalled(); expect(t.writes).toEqual([]);
 });
 it("guards shared content-language mutation entry points", async () => {
  mocks.editor.mockRejectedValue(Error("Forbidden")); const t = databaseWith();
  for (const run of [() => linkPostTranslation(BigInt(1), "en", "g", t.database), () => linkTermTranslation(BigInt(1), "en", "g", t.database), () => setPostLanguage(BigInt(1), "en", undefined, t.database), () => setTermLanguage(BigInt(1), "en", undefined, t.database)]) await expect(run()).rejects.toThrow("Forbidden");
  expect(t.tx.select).not.toHaveBeenCalled(); expect(t.writes).toEqual([]);
 });
 it.each(["../en", "file:///x", "e", "a".repeat(11), "en/../../x", "en?x=1"])("rejects unsafe locale %s", code => { expect(languageCodeSchema.safeParse(code).success).toBe(false); });
 it("does not rename languages or reset fields omitted by an edit", () => { expect(updateLanguageSchema.parse({ code: "new", name: " Name " })).toEqual({ name: "Name" }); });
 it("makes the first language active and default even if unchecked", async () => {
  const t = databaseWith([[{ total: 0 }]]); await createLanguage({ code: "DE", name: "German", isActive: false }, t.database);
  expect(t.writes[1]).toMatchObject({ values: { code: "de", isDefault: true, isActive: true } }); expect(t.committed()).toBe(true);
 });
 it("cannot deactivate or unset the default language", async () => {
  for (const data of [{ isActive: false }, { isDefault: false }]) { const t = databaseWith([[{ code: "en", isDefault: true }]]); await expect(updateLanguage("en", data, t.database)).rejects.toThrow("error.default"); expect(t.writes).toEqual([]); }
 });
 it("checks that a new default exists before clearing defaults", async () => {
  const t = databaseWith([[]]); await expect(setDefaultLanguage("de", t.database)).rejects.toThrow("error.missing"); expect(t.writes).toEqual([]); expect(t.committed()).toBe(false);
 });
 it("switches defaults and activates the target in one transaction", async () => {
  const t = databaseWith([[{ code: "de", isDefault: false }]]); await setDefaultLanguage("de", t.database);
  expect(t.writes).toHaveLength(2); expect(t.writes[0].values).toEqual({ isDefault: false }); expect(t.writes[1]).toMatchObject({ values: { isDefault: true, isActive: true }, params: ["de"] }); expect(t.committed()).toBe(true);
 });
 it("refuses deleting a default or content-assigned language", async () => {
  const t = databaseWith([[{ isDefault: true }]]); await expect(deleteLanguage("en", t.database)).rejects.toThrow("error.default"); expect(t.writes).toEqual([]);
  const used = databaseWith([[{ isDefault: false }], [{ total: 1 }], [{ total: 0 }]]); await expect(deleteLanguage("de", used.database)).rejects.toThrow("error.used"); expect(used.writes).toEqual([]);
 });
 it("validates an entire translation batch before starting writes", async () => {
  const t = databaseWith(); await expect(saveTranslationsBatch("en", { valid: "Good", invalid: "x".repeat(20001) }, t.database)).rejects.toThrow(); expect(t.writes).toEqual([]); expect(t.tx.transaction).not.toHaveBeenCalled();
 });
 it("rejects prototype-related keys and oversized batches", () => {
  for (const key of ["__proto__", "constructor", "a.prototype.b"]) expect(translationBatchSchema.safeParse(JSON.parse(`{"${key}":"value"}`)).success).toBe(false);
  expect(translationBatchSchema.safeParse(Object.fromEntries(Array.from({ length: 10001 }, (_, i) => [String(i), "v"]))).success).toBe(false);
 });
 it("drops reserved keys and non-string corrupt overrides from public dictionaries", async () => {
  const t = databaseWith([[{ key: "__proto__", value: "bad" }, { key: "constructor", value: "bad" }, { key: "bad", value: {} }, { key: "good", value: "Text" }]]);
  const dict = await getDbTranslations("en", t.database); expect(Object.keys(dict)).toEqual(["good"]); expect(Object.getPrototypeOf(dict)).toBe(null);
 });
 it.each(["https://evil.test", "//evil.test", "javascript:alert(1)", "/admincp/posts", "/\\evil.test", "/admincp/translations\n"])("blocks unsafe return URL %s", url => { expect(translationReturnUrlSchema.safeParse(url).success).toBe(false); });
 it("preserves a valid relative translation filter URL", () => { expect(translationReturnUrlSchema.parse("/admincp/translations?locale=ar&page=2#x")).toBe("/admincp/translations?locale=ar&page=2"); });
 it("prevents editor writes to category and page language links", async () => {
  mocks.editor.mockResolvedValue({ user: { role: "editor" } }); mocks.admin.mockRejectedValue(Error("Forbidden"));
  for (const [operation, type] of [[linkTermTranslation, "category"], [linkPostTranslation, "page"]] as const) {
   const t = databaseWith([[{ code: "en", isActive: true }], [{ type }]]); await expect(operation(BigInt(1), "en", "g", t.database)).rejects.toThrow("Forbidden"); expect(t.writes).toEqual([]);
  }
 });
 it("rejects duplicate languages and mixed taxonomy translation groups", async () => {
  for (const sibling of [{ id: BigInt(9), code: "en", type: "post_tag" }, { id: BigInt(9), code: "ar", type: "category" }]) {
   const t = databaseWith([[{ code: "en", isActive: true }], [{ type: "post_tag" }], [sibling]]);
   await expect(linkTermTranslation(BigInt(1), "en", "g", t.database)).rejects.toThrow("error.group"); expect(t.writes).toEqual([]);
  }
 });
 it("filters unpublished, protected and inactive siblings from public language links", async () => {
  const t = databaseWith([[{ translationGroupId: "g", languageCode: "en" }], []]); await getPostTranslations("1", t.database);
  const query = t.predicates[1]; expect(query.params).toEqual(["g", true, "publish", "", expect.any(String), "post", "page"]); expect(query.sql).toContain('"post_password"');
 });
});
