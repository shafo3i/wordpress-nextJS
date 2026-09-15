import { AdminShell } from "@/components/admin/admin-shell";
import { getAllPlugins, getCatalogPlugins } from "@/lib/plugins/loader";
import { PluginListHeader } from "@/components/admin/plugins/plugin-list-header";
import { PluginViewsNav } from "@/components/admin/plugins/plugin-views-nav";
import { PluginListTable } from "@/components/admin/plugins/plugin-list-table";
import { PluginInstallHeader } from "@/components/admin/plugins/add-new/plugin-install-header";
import { PluginDirectoryGrid } from "@/components/admin/plugins/add-new/plugin-directory-grid";

export const dynamic = "force-dynamic";

export default async function PluginsPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; status?: string; tab?: string; category?: string }>;
}) {
  const { s, status, tab, category } = await searchParams;
  const search = s?.trim().toLowerCase() ?? "";

  // 1. ADD NEW PLUGINS DIRECTORY VIEW
  if (tab === "add-new") {
    const activeCategory = category && ["Featured", "Popular", "Recommended"].includes(category)
      ? category
      : "Featured";

    const catalogPlugins = await getCatalogPlugins();

    const filteredCatalog = catalogPlugins.filter((plugin) => {
      // Category filter (if not searching)
      if (!search && plugin.category && plugin.category !== activeCategory) {
        return false;
      }

      // Search filter
      if (search) {
        const matchName = plugin.name.toLowerCase().includes(search);
        const matchDesc = plugin.description.toLowerCase().includes(search);
        const matchAuthor = plugin.author.toLowerCase().includes(search);
        return matchName || matchDesc || matchAuthor;
      }

      return true;
    });

    return (
      <AdminShell>
        <div className="space-y-4">
          <PluginInstallHeader search={s} activeCategory={activeCategory} />
          <PluginDirectoryGrid plugins={filteredCatalog} />
        </div>
      </AdminShell>
    );
  }

  // 2. INSTALLED PLUGINS LIST VIEW
  const currentStatus = status && ["all", "active", "inactive"].includes(status) ? status : "all";
  const installedPlugins = await getAllPlugins();

  const counts = {
    all: installedPlugins.length,
    active: installedPlugins.filter((p) => p.isActive).length,
    inactive: installedPlugins.filter((p) => !p.isActive).length,
  };

  const filteredInstalled = installedPlugins.filter((plugin) => {
    if (currentStatus === "active" && !plugin.isActive) return false;
    if (currentStatus === "inactive" && plugin.isActive) return false;

    if (search) {
      const matchName = plugin.name.toLowerCase().includes(search);
      const matchDesc = plugin.description.toLowerCase().includes(search);
      const matchAuthor = plugin.author.toLowerCase().includes(search);
      return matchName || matchDesc || matchAuthor;
    }

    return true;
  });

  return (
    <AdminShell>
      <div className="space-y-4">
        <PluginListHeader search={s} />
        <PluginViewsNav counts={counts} currentStatus={currentStatus} search={s} />
        <PluginListTable plugins={filteredInstalled} />
      </div>
    </AdminShell>
  );
}
