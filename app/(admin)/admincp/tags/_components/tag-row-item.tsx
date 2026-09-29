"use client";

import Link from "next/link";
import type { TagItem } from "@/services/tag.service";

export type TagRowData = TagItem;

export function TagRowItem({
  tag,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onDelete,
  basePath = "/admincp/tags",
  dict = {},
}: {
  tag: TagRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onDelete: () => void;
  basePath?: string;
  dict?: Record<string, string>;
}) {
  return (
    <tr className="group border-b border-[#f0f0f1] bg-white hover:bg-[#f6f7f7] last:border-b-0">
      <td className="w-8 px-3 py-2 text-center align-top">
        <input
          aria-label={`Select ${tag.name}`}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          onChange={(e) => onToggleSelect(e.target.checked)}
          type="checkbox"
        />
      </td>

      <td className="px-3 py-2 text-start align-top">
        <div className="flex items-baseline gap-1">
          <Link
            className="text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${tag.id}/edit`}
          >
            {tag.name}
          </Link>
        </div>

        {/* Hover Row Actions */}
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a7aaad] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${tag.id}/edit`}
          >
            {dict["admin.tags.edit"] || "Edit"}
          </Link>
          <span className="text-[#c3c4c7]">|</span>
          <button
            className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
            onClick={onQuickEdit}
            type="button"
          >
            {dict["admin.tags.quick_edit"] || "Quick Edit"}
          </button>
          <span className="text-[#c3c4c7]">|</span>
          <button
            className="text-[#b32d2e] hover:text-[#a00] hover:underline cursor-pointer"
            onClick={onDelete}
            type="button"
          >
            {dict["admin.tags.delete"] || "Delete"}
          </button>
          <span className="text-[#c3c4c7]">|</span>
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`/tag/${tag.slug}`}
            rel="noreferrer"
            target="_blank"
          >
            {dict["admin.tags.view"] || "View"}
          </Link>
        </div>
      </td>

      <td className="px-3 py-2 text-start text-[#50575e] align-top">
        {tag.description ? (
          <span className="line-clamp-2">{tag.description}</span>
        ) : (
          <span className="text-[#a7aaad]">—</span>
        )}
      </td>

      <td className="px-3 py-2 text-start text-[#50575e] align-top">
        {tag.slug}
      </td>

      <td className="px-3 py-2 text-center align-top font-medium text-[#2271b1]">
        <Link
          className="hover:underline"
          href={`/admincp/posts?tag=${tag.slug}`}
        >
          {tag.count}
        </Link>
      </td>
    </tr>
  );
}
