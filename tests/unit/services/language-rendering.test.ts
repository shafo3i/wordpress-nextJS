import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
import ar from "@/templates/language/ar.json";
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("@/app/(admin)/admincp/translations/action", () => ({ saveTranslationAction: vi.fn(), deleteTranslationOverrideAction: vi.fn() }));
vi.mock("@/app/(admin)/admincp/languages/action", () => ({ createLanguageAction: vi.fn(), updateLanguageAction: vi.fn() }));
import { TranslationTable } from "@/app/(admin)/admincp/translations/_components/translation-table";
import { LanguageForm } from "@/app/(admin)/admincp/languages/_components/language-form";
const item = { key:"site.title", group:"<img src=x onerror=alert(1)>", baseValue:"<script>alert(1)</script>", templateValue:"<svg onload=alert(1)>", currentValue:'"><img src=x onerror=alert(1)>', dbValue:null, isOverridden:false, isMissing:false };
describe("language and translation rendering", () => {
 it.each([en,ar])("escapes translation content and gives each row a unique form target", dict => {
  const html = renderToStaticMarkup(createElement(TranslationTable, { items:[item,{...item,key:"site_title"}], currentPage:1,totalPages:1,totalItems:2,locale:"en",group:"all",filter:"all",searchQuery:"",returnUrl:"/admincp/translations",dict }));
  expect(html).not.toContain("<script>alert(1)</script>"); expect(html).not.toContain("<img"); expect(html).not.toContain("<svg onload"); expect(html).toContain("&lt;script&gt;");
  expect(html).toContain('id="trans-0"'); expect(html).toContain('id="trans-1"'); expect(html).toContain('form="trans-1"');
 });
 it("renders hidden false checkbox values so unchecked edits can disable a language", () => {
  const html = renderToStaticMarkup(createElement(LanguageForm,{dict:en}));
  expect(html).toMatch(/name="isActive"[^>]*value="false"/); expect(html).toMatch(/name="isDefault"[^>]*value="false"/);
 });
});
