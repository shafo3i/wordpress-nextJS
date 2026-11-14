import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), editor: vi.fn(), save: vi.fn(), reset: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), default: vi.fn(), language: vi.fn(), redirect: vi.fn(), cookie: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.admin, verifyPostEditor: mocks.editor }));
vi.mock("@/components/admin/admin-shell", () => ({ getAdminLanguageContext: async () => ({ dict: en }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.cookie }) }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, unstable_rethrow: () => {} }));
vi.mock("@/services/language.service", () => ({ LanguageMutationError: class extends Error { key = "admin.languages.error.missing" }, saveTranslation: mocks.save, deleteTranslationOverride: mocks.reset, createLanguage: mocks.create, updateLanguage: mocks.update, deleteLanguage: mocks.remove, setDefaultLanguage: mocks.default, getLanguageByCode: mocks.language }));
import { saveTranslationAction, deleteTranslationOverrideAction } from "@/app/(admin)/admincp/translations/action";
import { createLanguageAction, updateLanguageAction, deleteLanguageAction, setDefaultLanguageAction, toggleLanguageStatusAction, switchAdminLanguageAction } from "@/app/(admin)/admincp/languages/action";
function form(values: Record<string,string>) { const data = new FormData(); for (const [key,value] of Object.entries(values)) data.set(key,value); return data; }
beforeEach(() => { vi.clearAllMocks(); mocks.admin.mockResolvedValue({ user: { role: "admin" } }); mocks.editor.mockResolvedValue({ user: { role: "editor" } }); mocks.language.mockResolvedValue({ code: "en", isActive: true }); });
describe("language action security", () => {
 it("denies administrative actions before services", async () => {
  mocks.admin.mockRejectedValue(Error("Forbidden"));
  for (const run of [() => createLanguageAction(new FormData()), () => updateLanguageAction(new FormData()), () => deleteLanguageAction(new FormData()), () => setDefaultLanguageAction(new FormData()), () => toggleLanguageStatusAction(new FormData()), () => saveTranslationAction(new FormData()), () => deleteTranslationOverrideAction(new FormData())]) await expect(run()).rejects.toThrow("Forbidden");
  for (const service of [mocks.save,mocks.reset,mocks.create,mocks.update,mocks.remove,mocks.default]) expect(service).not.toHaveBeenCalled();
 });
 it.each(["https://evil.test", "//evil.test", "javascript:alert(1)"])("prevents a translation save redirect to %s", async returnUrl => {
  await saveTranslationAction(form({ languageCode: "en", key: "site.test", value: "Label", returnUrl })); expect(mocks.redirect).toHaveBeenCalledWith("/admincp/translations?locale=en");
 });
 it("keeps safe translation filter return URLs", async () => {
  await deleteTranslationOverrideAction(form({ languageCode:"ar", key:"site.test", returnUrl:"/admincp/translations?locale=ar&page=2" })); expect(mocks.redirect).toHaveBeenCalledWith("/admincp/translations?locale=ar&page=2");
 });
 it("does not expose database details on a failed save", async () => {
  mocks.save.mockRejectedValue(Error("private SQL and credentials")); await expect(saveTranslationAction(form({ languageCode:"en", key:"site.test", value:"Label" }))).rejects.toThrow(en["admin.languages.error.failed"]); expect(mocks.redirect).not.toHaveBeenCalled(); expect(mocks.revalidate).not.toHaveBeenCalled();
 });
 it("processes unchecked active/default checkboxes as false", async () => {
  await updateLanguageAction(form({ originalCode:"de", isActive:"false", isDefault:"false" })); expect(mocks.update).toHaveBeenCalledWith("de", { isActive:false, isDefault:false });
 });
 it("requires authentication and a known active locale before setting the admin cookie", async () => {
  mocks.editor.mockRejectedValueOnce(Error("Forbidden")); await expect(switchAdminLanguageAction(form({ code:"en" }))).rejects.toThrow("Forbidden"); expect(mocks.cookie).not.toHaveBeenCalled();
  mocks.language.mockResolvedValueOnce({ isActive:false }); await expect(switchAdminLanguageAction(form({ code:"de" }))).rejects.toThrow(); expect(mocks.cookie).not.toHaveBeenCalled();
  await switchAdminLanguageAction(form({ code:"en" })); expect(mocks.cookie).toHaveBeenCalledWith("admin_lang", "en", expect.objectContaining({ httpOnly:true, sameSite:"lax", path:"/" }));
 });
});
