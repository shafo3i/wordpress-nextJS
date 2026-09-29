import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getMenus, getMenu, getMenuAvailableItems } from "./query";
import { MenuSelectorBar, MenuManagerShell } from "./_components";

export const dynamic = "force-dynamic";

interface MenusPageProps {
  searchParams: Promise<{
    menu?: string;
    lang?: string;
  }>;
}

export default async function MenusPage({ searchParams }: MenusPageProps) {
  await verifyAdminOrEditor();

  const { menu: menuParam, lang } = await searchParams;
  const currentLanguage = lang || "all";

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const allMenus = await getMenus({ language: currentLanguage });
  const activeMenuId = menuParam || (allMenus[0]?.id ?? null);
  const currentMenu = activeMenuId ? await getMenu(activeMenuId) : null;

  // Fetch available items (pages, categories, posts)
  const availableItems = await getMenuAvailableItems({
    language: currentLanguage !== "all" ? currentLanguage : undefined,
  });

  return (
    <AdminShell>
      <div dir={direction} className="space-y-6 text-start">
        <div>
          <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">
            {dict["admin.menus.title"] || "Menus"}
          </h1>
          <p className="text-[12px] text-[#646970] mt-1">
            {dict["admin.menus.desc"] ||
              "Manage your navigation menus and assign them to site theme locations."}
          </p>
        </div>

        <MenuSelectorBar
          menus={allMenus}
          currentMenuId={activeMenuId || undefined}
          currentLanguage={currentLanguage}
          languages={langContext.allLanguages}
          dict={dict}
          direction={direction}
        />

        {currentMenu ? (
          <MenuManagerShell
            key={currentMenu.id}
            menu={currentMenu}
            initialItems={currentMenu.items}
            locations={currentMenu.locations}
            pages={availableItems.pages}
            categories={availableItems.categories}
            posts={availableItems.posts}
            languages={langContext.allLanguages}
            dict={dict}
            direction={direction}
          />
        ) : (
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white p-8 text-center text-[13px] text-[#646970]">
            {dict["admin.menus.no_menus_found"] ||
              "No menus found. Use the selector above to create your first navigation menu."}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
