import { AdminShell } from "@/components/admin/admin-shell";
import { getAllThemes } from "@/lib/themes/loader";
import { ThemeHeader } from "@/components/admin/themes/theme-header";
import { ThemeGrid } from "@/components/admin/themes/theme-grid";

export const dynamic = "force-dynamic";

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const search = s?.trim().toLowerCase() ?? "";

  const allThemes = await getAllThemes();

  const filteredThemes = allThemes.filter((theme) => {
    if (!search) return true;
    const matchName = theme.name.toLowerCase().includes(search);
    const matchDesc = theme.description.toLowerCase().includes(search);
    const matchTags = theme.tags?.toLowerCase().includes(search);
    return matchName || matchDesc || matchTags;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <ThemeHeader search={s} />
        <ThemeGrid themes={filteredThemes} />
      </div>
    </AdminShell>
  );
}
