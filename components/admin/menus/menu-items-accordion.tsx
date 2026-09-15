"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function MenuItemsAccordion({
  pages,
  categories,
  onAddItems,
}: {
  pages: { id: string; title: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  onAddItems: (items: { title: string; url: string }[]) => void;
}) {
  const [openSection, setOpenSection] = useState<"pages" | "categories" | "custom">("pages");

  // Selection states
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState("https://");
  const [customText, setCustomText] = useState("");

  const handleAddPages = () => {
    if (!selectedPages.length) return;
    const itemsToAdd = pages
      .filter((p) => selectedPages.includes(p.id))
      .map((p) => ({
        title: p.title,
        url: `/${p.slug}`,
      }));
    onAddItems(itemsToAdd);
    setSelectedPages([]);
  };

  const handleAddCategories = () => {
    if (!selectedCategories.length) return;
    const itemsToAdd = categories
      .filter((c) => selectedCategories.includes(c.id))
      .map((c) => ({
        title: c.name,
        url: `/category/${c.slug}`,
      }));
    onAddItems(itemsToAdd);
    setSelectedCategories([]);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || !customUrl.trim()) return;
    onAddItems([{ title: customText.trim(), url: customUrl.trim() }]);
    setCustomText("");
    setCustomUrl("https://");
  };

  return (
    <div className="space-y-3 text-[13px]">
      <p className="font-semibold text-[#1d2327]">Add menu items</p>

      {/* 1. PAGES ACCORDION */}
      <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === "pages" ? (null as any) : "pages")}
          className="flex w-full items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-3.5 py-2.5 font-semibold text-[#2c3338] hover:bg-[#f0f0f1]"
        >
          <span>Pages</span>
          {openSection === "pages" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        {openSection === "pages" && (
          <div className="p-3.5 space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#dcdcde] p-2.5 bg-white">
              {pages.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(p.id)}
                    onChange={(e) =>
                      setSelectedPages((curr) =>
                        e.target.checked ? [...curr, p.id] : curr.filter((id) => id !== p.id)
                      )
                    }
                    className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="text-[#2c3338] truncate">{p.title}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() =>
                  setSelectedPages(
                    selectedPages.length === pages.length ? [] : pages.map((p) => p.id)
                  )
                }
                className="text-[12px] text-[#2271b1] hover:underline"
              >
                {selectedPages.length === pages.length ? "Deselect All" : "Select All"}
              </button>

              <button
                type="button"
                disabled={!selectedPages.length}
                onClick={handleAddPages}
                className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[12px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors disabled:opacity-50"
              >
                Add to Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. CATEGORIES ACCORDION */}
      <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === "categories" ? (null as any) : "categories")}
          className="flex w-full items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-3.5 py-2.5 font-semibold text-[#2c3338] hover:bg-[#f0f0f1]"
        >
          <span>Categories</span>
          {openSection === "categories" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        {openSection === "categories" && (
          <div className="p-3.5 space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#dcdcde] p-2.5 bg-white">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(c.id)}
                    onChange={(e) =>
                      setSelectedCategories((curr) =>
                        e.target.checked ? [...curr, c.id] : curr.filter((id) => id !== c.id)
                      )
                    }
                    className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="text-[#2c3338] truncate">{c.name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() =>
                  setSelectedCategories(
                    selectedCategories.length === categories.length ? [] : categories.map((c) => c.id)
                  )
                }
                className="text-[12px] text-[#2271b1] hover:underline"
              >
                {selectedCategories.length === categories.length ? "Deselect All" : "Select All"}
              </button>

              <button
                type="button"
                disabled={!selectedCategories.length}
                onClick={handleAddCategories}
                className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[12px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors disabled:opacity-50"
              >
                Add to Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. CUSTOM LINKS ACCORDION */}
      <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === "custom" ? (null as any) : "custom")}
          className="flex w-full items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-3.5 py-2.5 font-semibold text-[#2c3338] hover:bg-[#f0f0f1]"
        >
          <span>Custom Links</span>
          {openSection === "custom" ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        {openSection === "custom" && (
          <form onSubmit={handleAddCustom} className="p-3.5 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[#50575e] mb-1">URL</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#50575e] mb-1">Link Text</label>
              <input
                type="text"
                placeholder="e.g. Special Coverage"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!customText.trim() || !customUrl.trim()}
                className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-[12px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors disabled:opacity-50"
              >
                Add to Menu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
