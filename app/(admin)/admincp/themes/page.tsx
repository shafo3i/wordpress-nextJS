import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getThemesQuery } from "./query";
import { ThemeHeader, ThemeGrid } from "./_components";

export const dynamic = "force-dynamic";

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  await verifyAdminOrEditor();

  const { s } = await searchParams;
  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const { themes } = await getThemesQuery(s);

  return (
    <AdminShell>
      <div dir={direction} className="space-y-6 text-start">
        <ThemeHeader search={s} dict={dict} direction={direction} />
        <ThemeGrid themes={themes} dict={dict} direction={direction} />
      </div>
    </AdminShell>
  );
}
