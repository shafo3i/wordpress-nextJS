"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type CategoryItem = {
  slug: string;
  name: string;
};

export function MetaBoxCategories({
  categories,
  selectedCategories,
  onToggleCategory,
}: {
  categories: CategoryItem[];
  selectedCategories: string[];
  onToggleCategory: (slug: string, checked: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "popular">("all");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [localCategories, setLocalCategories] = useState(categories);

  const handleAddNew = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!localCategories.some((c) => c.slug === slug)) {
      setLocalCategories([...localCategories, { name: trimmed, slug }]);
      onToggleCategory(slug, true);
    }
    setNewCatName("");
    setIsAddingNew(false);
  };

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Categories</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-xs text-[#50575e]">
          {/* Tabs: All Categories | Most Used */}
          <div className="mb-2 flex items-center border-b border-[#c3c4c7] text-xs">
            <button
              className={`px-3 py-1 font-medium ${
                activeTab === "all"
                  ? "-mb-[1px] border-x border-t border-[#c3c4c7] bg-white text-[#1d2327]"
                  : "text-[#2271b1] hover:text-[#135e96]"
              }`}
              onClick={() => setActiveTab("all")}
              type="button"
            >
              All Categories
            </button>
            <button
              className={`px-3 py-1 font-medium ${
                activeTab === "popular"
                  ? "-mb-[1px] border-x border-t border-[#c3c4c7] bg-white text-[#1d2327]"
                  : "text-[#2271b1] hover:text-[#135e96]"
              }`}
              onClick={() => setActiveTab("popular")}
              type="button"
            >
              Most Used
            </button>
          </div>

          {/* Checklist */}
          <div className="max-h-48 overflow-y-auto rounded-[3px] border border-[#dcdcde] bg-white p-2">
            {localCategories.length ? (
              localCategories.map((cat) => (
                <label
                  className="flex items-center gap-2 py-1 text-xs hover:bg-[#f0f6fc]"
                  key={cat.slug}
                >
                  <input
                    checked={selectedCategories.includes(cat.slug)}
                    className="h-3.5 w-3.5 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    onChange={(e) => onToggleCategory(cat.slug, e.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-[#2c3338]">{cat.name}</span>
                </label>
              ))
            ) : (
              <span className="text-[#646970]">No categories available.</span>
            )}
          </div>

          {/* Add New Category Toggle */}
          <div className="mt-2.5">
            {!isAddingNew ? (
              <button
                className="text-xs font-medium text-[#2271b1] underline hover:text-[#135e96]"
                onClick={() => setIsAddingNew(true)}
                type="button"
              >
                + Add New Category
              </button>
            ) : (
              <div className="mt-2 space-y-2 rounded border border-[#dcdcde] bg-[#f6f7f7] p-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#50575e]">
                    New Category Name
                  </label>
                  <input
                    className="h-[28px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
                    onChange={(e) => setNewCatName(e.target.value)}
                    type="text"
                    value={newCatName}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-1 text-xs text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1]"
                    onClick={handleAddNew}
                    type="button"
                  >
                    Add New Category
                  </button>
                  <button
                    className="text-xs text-[#2271b1] underline"
                    onClick={() => setIsAddingNew(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
