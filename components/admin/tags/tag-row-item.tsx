import Link from "next/link";

export type TagRowData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
};

export function TagRowItem({
  tag,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onDelete,
  basePath = "/admincp/tags",
}: {
  tag: TagRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onDelete: () => void;
  basePath?: string;
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

      <td className="px-3 py-2 align-top">
        <Link
          className="text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline"
          href={`${basePath}/${tag.id}/edit`}
        >
          {tag.name}
        </Link>

        {/* Hover Row Actions */}
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a7aaad] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${tag.id}/edit`}
          >
            Edit
          </Link>
          <span>|</span>
          <button
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            onClick={onQuickEdit}
            type="button"
          >
            Quick Edit
          </button>
          <span>|</span>
          <button
            className="text-[#b32d2e] hover:text-[#8c1617] hover:underline"
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
          <span>|</span>
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`/tag/${tag.slug}`}
            target="_blank"
          >
            View
          </Link>
        </div>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top">
        {tag.description || "—"}
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top">
        {tag.slug}
      </td>

      <td className="px-3 py-2 text-center align-top">
        <Link
          className="text-[13px] font-medium text-[#2271b1] hover:underline"
          href={`/admincp/posts?tag=${tag.slug}`}
        >
          {tag.count}
        </Link>
      </td>
    </tr>
  );
}
