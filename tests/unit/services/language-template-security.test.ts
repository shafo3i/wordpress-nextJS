import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ body: "{}", size: 2, symlink: false, read: vi.fn() }));
vi.mock("server-only", () => ({})); vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: vi.fn(), verifyPostEditor: vi.fn() }));
vi.mock("node:fs", () => ({ existsSync: () => true, readdirSync: () => ["en.json", "ar.json", "../evil.json", "a.json", "en.txt"],
 lstatSync: () => ({ isFile: () => true, isSymbolicLink: () => mocks.symlink, size: mocks.size }),
 readFileSync: (...args: unknown[]) => { mocks.read(...args); return mocks.body; },
}));
import { getAvailableTemplateLocales, getTemplateTranslations } from "@/services/language.service";
beforeEach(() => { vi.clearAllMocks(); mocks.body = '{"site.title":"Title"}'; mocks.size = 22; mocks.symlink = false; });
describe("language template file validation", () => {
 it("discovers only valid locale JSON filenames", () => { expect(getAvailableTemplateLocales()).toEqual(["en", "ar"]); });
 it.each(["../en", "../../package", "file:///test", "en/../../file"])("does not read traversal path %s", code => { expect(getTemplateTranslations(code)).toEqual({}); expect(mocks.read).not.toHaveBeenCalled(); });
 it.each(['[]', 'null', '"text"', '{"key": {"nested":"value"}}', '{"key": 42}', '{"__proto__":"value"}', '{"constructor":"value"}', '{broken'])
 ("rejects malformed or non-flat JSON %s", body => { mocks.body = body; expect(getTemplateTranslations("en")).toEqual({}); });
 it("rejects oversized files and symlinks before reading their contents", () => { mocks.size = 5000001; expect(getTemplateTranslations("en")).toEqual({}); expect(mocks.read).not.toHaveBeenCalled(); mocks.size = 22; mocks.symlink = true; expect(getTemplateTranslations("en")).toEqual({}); expect(mocks.read).not.toHaveBeenCalled(); });
 it("loads a valid flat template", () => { expect(getTemplateTranslations("en")).toEqual({ "site.title": "Title" }); });
});
