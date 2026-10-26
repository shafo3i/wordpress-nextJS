import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getActiveLanguages } from "@/services/language.service";
import { getWidgetsQuery } from "./query";
import { WidgetsManagerShell } from "./_components";

export const dynamic = "force-dynamic";

export default async function WidgetsPage() {
  await verifyAdminOrEditor();

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const [{ areas, availableWidgets }, activeLanguages] = await Promise.all([
    getWidgetsQuery(),
    getActiveLanguages().catch(() => []),
  ]);

  return (
    <AdminShell>
      <WidgetsManagerShell
        initialAreas={areas}
        availableWidgets={availableWidgets}
        dict={dict}
        direction={direction}
        languages={activeLanguages}
      />
    </AdminShell>
  );
}
