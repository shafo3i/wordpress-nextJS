import Link from "next/link";

export type CategoryRowData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string;
  count: number;
};

export function CategoryRowItem({
  category,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onDelete,
  basePath = "/admincp/categories",
}: {
  category: CategoryRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onDelete: () => void;
  basePath?: string;
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

      <td className="px-3 py-2 align-top">
        <div className="flex items-baseline gap-1">
          {hasParent && <span className="text-[#8c8f94]">—— </span>}
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
          {!isDefault && (
            <>
              <span>|</span>
              <button
                className="text-[#b32d2e] hover:text-[#8c1617] hover:underline"
                onClick={onDelete}
                type="button"
              >
                Delete
              </button>
            </>
          )}
          <span>|</span>
          <Link
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`/category/${category.slug}`}
            target="_blank"
          >
            View
          </Link>
        </div>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top">
        {category.description || "—"}
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top">
        {category.slug}
      </td>

      <td className="px-3 py-2 text-center align-top">
        <Link
          className="text-[13px] font-medium text-[#2271b1] hover:underline"
          href={`/admincp/posts?category=${category.slug}`}
        >
          {category.count}
        </Link>
      </td>
    </tr>
  );
}
