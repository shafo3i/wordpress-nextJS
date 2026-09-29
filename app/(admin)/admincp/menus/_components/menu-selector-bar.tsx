"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createMenuAction } from "../action";

interface MenuSelectorBarProps {
  menus: { id: string; name: string; slug: string; language?: string }[];
  currentMenuId?: string;
  currentLanguage?: string;
  languages?: { code: string; name: string; nativeName?: string }[];
  dict: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function MenuSelectorBar({
  menus,
  currentMenuId,
  currentLanguage = "all",
  languages = [],
  dict,
  direction = "ltr",
}: MenuSelectorBarProps) {
  const [selectedId, setSelectedId] = useState(currentMenuId || (menus[0]?.id ?? ""));
  const [isCreating, setIsCreating] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep selectedId synchronized when currentMenuId changes
  useEffect(() => {
    if (currentMenuId) {
      setSelectedId(currentMenuId);
    }
  }, [currentMenuId]);

  const navigateToMenu = (menuId: string) => {
    if (!menuId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("menu", menuId);
    router.push(`/admincp/menus?${params.toString()}`);
  };

  const handleSelect = () => {
    navigateToMenu(selectedId);
  };

  const handleMenuDropdownChange = (newId: string) => {
    setSelectedId(newId);
    navigateToMenu(newId);
  };

  const handleLanguageChange = (code: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (code && code !== "all") {
      params.set("lang", code);
    } else {
      params.delete("lang");
    }
    router.push(`/admincp/menus?${params.toString()}`);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim()) return;
    setErrorNotice(null);

    startTransition(async () => {
      const res = await createMenuAction({
        name: newMenuName.trim(),
        language: currentLanguage !== "all" ? currentLanguage : undefined,
      });

      if (res.success && res.menuId) {
        setIsCreating(false);
        setNewMenuName("");
        const params = new URLSearchParams(searchParams.toString());
        params.set("menu", res.menuId);
        router.push(`/admincp/menus?${params.toString()}`);
      } else {
        setErrorNotice(res.error || dict["admin.menus.failed_notice"] || "Failed to create menu");
      }
    });
  };

  return (
    <div
      dir={direction}
      className="space-y-3 rounded-[3px] border border-[#c3c4c7] bg-white p-3.5 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start"
    >
      {errorNotice && (
        <div className="flex items-center justify-between rounded-[3px] border-s-4 border-[#d63638] bg-[#fcf0f1] p-3 text-[13px] text-[#1d2327]">
          <span>{errorNotice}</span>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {isCreating ? (
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
          <label htmlFor="new-menu-name" className="font-semibold text-[#1d2327]">
            {dict["admin.menus.menu_name"] || "Menu Name"}:
          </label>
          <input
            id="new-menu-name"
            type="text"
            placeholder={dict["admin.menus.menu_name_placeholder"] || "e.g. Primary Navigation"}
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !newMenuName.trim()}
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50"
          >
            {isPending
              ? dict["admin.menus.creating"] || "Creating..."
              : dict["admin.menus.create_button"] || "Create Menu"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="h-[30px] rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3 text-[#50575e] hover:bg-[#f0f0f1]"
          >
            {dict["common.cancel"] || "Cancel"}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="select-menu-to-edit" className="text-[#50575e]">
              {dict["admin.menus.select_menu_to_edit"] || "Select a menu to edit:"}
            </label>
            <select
              id="select-menu-to-edit"
              value={selectedId}
              onChange={(e) => handleMenuDropdownChange(e.target.value)}
              className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSelect}
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
            >
              {dict["admin.menus.select_button"] || "Select"}
            </button>
            <span className="text-[#a7aaad]">{dict["admin.menus.or"] || "or"}</span>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            >
              {dict["admin.menus.create_new_menu"] || "create a new menu"}
            </button>
          </div>

          {languages.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="menu-lang-filter" className="text-[12px] text-[#50575e]">
                {dict["admin.menus.filter_by_language"] || "Filter by Language"}:
              </label>
              <select
                id="menu-lang-filter"
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[12px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
              >
                <option value="all">
                  {dict["admin.menus.all_languages"] || "All Languages"}
                </option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName ? `${lang.nativeName} (${lang.name})` : lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
