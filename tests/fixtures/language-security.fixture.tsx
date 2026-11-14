import { createRoot } from "react-dom/client";
import { LanguageForm } from "../../app/(admin)/admincp/languages/_components/language-form";
import { TranslationTable } from "../../app/(admin)/admincp/translations/_components/translation-table";
export function mount(dict: Record<string, string>) {
  const item = { key: "site.title", group: "site", baseValue: "<img src=x onerror=alert(1)>", templateValue: "Label", currentValue: "Label", dbValue: null, isOverridden: false, isMissing: false };
  createRoot(document.getElementById("fixture")!).render(<>
    <LanguageForm dict={dict} defaultValues={{ code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", isDefault: false, isActive: true, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() }} />
    <TranslationTable dict={dict} items={[item, { ...item, key: "site_title" }]} currentPage={1} totalPages={1} totalItems={2} locale="de" group="all" filter="all" searchQuery="" returnUrl="/admincp/translations?locale=de" />
  </>);
}
