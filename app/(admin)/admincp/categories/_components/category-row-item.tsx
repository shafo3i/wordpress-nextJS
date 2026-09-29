"use client";

import Link from "next/link";
import type { CategoryItem } from "@/services/category.service";

export type CategoryRowData = CategoryItem;

export function CategoryRowItem({
  category,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onDelete,
  basePath = "/admincp/categories",
  dict = {},
}: {
  category: CategoryRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onDelete: () => void;
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
