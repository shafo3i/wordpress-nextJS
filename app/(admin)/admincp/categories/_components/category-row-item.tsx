"use client";

import Link from "next/link";
import type { CategoryItem } from "@/services/category.service";
import type { SelectLanguage } from "@/db/schema/cms-languages";

export type CategoryRowData = CategoryItem;

export function CategoryRowItem({
  category,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onDelete,
  languages = [],
  basePath = "/admincp/categories",
  dict = {},
}: {
  category: CategoryRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onDelete: () => void;
  languages?: SelectLanguage[];
  basePath?: string;
  dict?: Record<string, string>;
}) {
  const isDefault = category.slug === "uncategorized";
  const hasParent = category.parent && category.parent !== "0";

  return (
    <tr className="group border-b border-[#f0f0f1] bg-white hover:bg-[#f6f7f7] last:border-b-0">
      <td className="w-8 px-3 py-2 text-center align-top">
        <input
          aria-label={`Select ${category.name}`}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] disabled:opacity-40"
          disabled={isDefault}
          onChange={(e) => onToggleSelect(e.target.checked)}
          type="checkbox"
        />
      </td>

      <td className="px-3 py-2 text-start align-top">
        <div className="flex items-baseline gap-1">
          {hasParent && <span className="text-[#8c8f94] select-none" dir="ltr">—— </span>}
          <Link
            className="text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${category.id}/edit`}
          >
            {category.name}
          </Link>
        </div>

        {/* Hover Row Actions */}
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a7aaad] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${category.id}/edit`}
          >
            {dict["admin.categories.edit"] || "Edit"}
          </Link>
          <span className="text-[#c3c4c7]">|</span>
          <button
            className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
            onClick={onQuickEdit}
            type="button"
          >
            {dict["admin.categories.quick_edit"] || "Quick Edit"}
          </button>

          {!isDefault && (
            <>
              <span className="text-[#c3c4c7]">|</span>
              <button
                className="text-[#b32d2e] hover:text-[#a00] hover:underline cursor-pointer"
                onClick={onDelete}
                type="button"
              >
                {dict["admin.categories.delete"] || "Delete"}
              </button>
            </>
          )}

          <span className="text-[#c3c4c7]">|</span>
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`/category/${category.slug}`}
            rel="noreferrer"
            target="_blank"
          >
            {dict["admin.categories.view"] || "View"}
          </Link>
        </div>
      </td>

      <td className="px-3 py-2 text-start text-[#50575e] align-top">
        {category.description ? (
          <span className="line-clamp-2">{category.description}</span>
        ) : (
          <span className="text-[#a7aaad]">—</span>
        )}
      </td>

      <td className="px-3 py-2 text-start text-[#50575e] align-top">
        {category.slug}
      </td>

      <td className="px-3 py-2 text-center align-top whitespace-nowrap">
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center rounded border border-[#c3c4c7] bg-[#f0f0f1] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#50575e]">
            {category.languageCode || "en"}
          </span>
          {languages
            .filter((l) => l.code !== (category.languageCode || "en"))
            .map((otherLang) => {
              const tr = category.translations?.find(
                (t) => t.languageCode === otherLang.code
              );
              if (tr) {
                return (
                  <Link
                    className="inline-flex items-center justify-center size-5 rounded hover:bg-[#dcdcde] text-[11px] font-semibold text-[#2271b1]"
                    href={`${basePath}/${tr.termId}/edit`}
                    key={otherLang.code}
                    title={`${otherLang.name}: ${tr.name}`}
                  >
                    ✓
                  </Link>
                );
              }
              return (
                <Link
                  className="inline-flex items-center justify-center size-5 rounded border border-dashed border-[#8c8f94] hover:bg-[#2271b1] hover:text-white text-[11px] text-[#50575e]"
                  href={`${basePath}?targetLang=${otherLang.code}&sourceTaxId=${category.termTaxonomyId}#add-category`}
                  key={otherLang.code}
                  title={`Add ${otherLang.name} translation`}
                >
                  +
                </Link>
              );
            })}
        </div>
      </td>

      <td className="px-3 py-2 text-center align-top font-medium text-[#2271b1]">
        <Link
          className="hover:underline"
          href={`/admincp/posts?category=${category.slug}`}
        >
          {category.count}
        </Link>
      </td>
    </tr>
  );
}
