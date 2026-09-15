import { AdminShell } from "@/components/admin/admin-shell";
import {
  getAllMenus,
  getCategoriesForMenu,
  getMenuWithItems,
  getPublishedPagesForMenu,
} from "@/lib/menus/db";
import { MenuSelectorBar } from "@/components/admin/menus/menu-selector-bar";
import { MenuManagerShell } from "@/components/admin/menus/menu-manager-shell";

export const dynamic = "force-dynamic";

export default async function MenusPage({
  searchParams,
}: {
  searchParams: Promise<{ menu?: string }>;
}) {
  const { menu: menuParam } = await searchParams;

  const [allMenus, pages, categories] = await Promise.all([
    getAllMenus(),
    getPublishedPagesForMenu(),
    getCategoriesForMenu(),
  ]);

  const activeMenuId = menuParam || (allMenus[0]?.id ?? null);
  const currentMenu = activeMenuId ? await getMenuWithItems(activeMenuId) : null;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">Menus</h1>
          <p className="text-[12px] text-[#646970] mt-1">
            Manage your navigation menus and assign them to site theme locations.
          </p>
        </div>

        <MenuSelectorBar menus={allMenus} currentMenuId={activeMenuId || undefined} />

        {currentMenu ? (
          <MenuManagerShell
            menu={currentMenu}
            initialItems={currentMenu.items}
            locations={currentMenu.locations}
            pages={pages}
            categories={categories}
          />
        ) : (
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-8 text-center text-[13px] text-[#646970]">
            No menus found. Use the selector above to create your first navigation menu.
          </div>
        )}
      </div>
    </AdminShell>
  );
}
