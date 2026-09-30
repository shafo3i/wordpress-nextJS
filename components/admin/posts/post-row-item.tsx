import Link from "next/link";

export type PostRowData = {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorName: string;
  categories: string[];
  categorySlugs?: string[];
  tags: string[];
  commentCount: string;
  date: string;
  commentStatus?: string;
  pingStatus?: string;
  postPassword?: string;
  languageCode?: string;
  translations?: { languageCode: string; postId: string; title: string }[];
};

function formatPostDate(
  value: string,
  dict: Record<string, string> = {},
  direction: "rtl" | "ltr" = "ltr"
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const isPm = hours >= 12;
  const hour12 = hours % 12 || 12;

  if (direction === "rtl") {
    const ampm = isPm ? "م" : "ص";
    return `${yyyy}/${mm}/${dd} في ${hour12}:${minutes} ${ampm}`;
  }
  const ampm = isPm ? (dict["admin.posts.pm"] || "pm") : (dict["admin.posts.am"] || "am");
  const atLabel = dict["admin.posts.at"] || "at";
  return `${yyyy}/${mm}/${dd} ${atLabel} ${hour12}:${minutes} ${ampm}`;
}

export function PostRowItem({
  post,
  index = 0,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onTrash,
  onRestore,
  onDeletePermanently,
  basePath = "/admincp/posts",
  dict = {},
  direction = "ltr",
}: {
  post: PostRowData;
  index?: number;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onTrash: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
  basePath?: string;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const isDraft = post.status === "draft";
  const isPendingReview = post.status === "pending";
  const isPrivate = post.status === "private";
  const isTrash = post.status === "trash";

  const isEven = index % 2 === 1;
  const rowBg = isEven ? "bg-[#f6f7f7]" : "bg-white";

  return (
    <tr
      className={`group border-b border-[#c3c4c7]/40 ${rowBg} hover:bg-[#f0f0f1] last:border-b-0 text-start transition-colors`}
      dir={direction}
    >
      <td className="w-[38px] px-3 py-2 text-center align-top">
        <input
          aria-label={`Select ${post.title || "post"}`}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          onChange={(e) => onToggleSelect(e.target.checked)}
          type="checkbox"
        />
      </td>

      <td className="px-3 py-2 align-top">
        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
          <Link
            className="text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${post.id}/edit`}
          >
            <bdi>{post.title || dict["admin.pages.no_title"] || "(no title)"}</bdi>
          </Link>
          {isDraft && (
            <span className="post-state inline-flex items-center gap-1 text-[13px] font-medium text-[#50575e]">
              <span aria-hidden="true">—</span>
              <bdi>{dict["admin.posts.status.draft"] || dict["admin.common.draft"] || "Draft"}</bdi>
            </span>
          )}
          {isPendingReview && (
            <span className="post-state inline-flex items-center gap-1 text-[13px] font-medium text-[#50575e]">
              <span aria-hidden="true">—</span>
              <bdi>{dict["admin.posts.status.pending"] || dict["admin.common.pending"] || "Pending"}</bdi>
            </span>
          )}
          {isPrivate && (
            <span className="post-state inline-flex items-center gap-1 text-[13px] font-medium text-[#50575e]">
              <span aria-hidden="true">—</span>
              <bdi>{dict["admin.posts.status.private"] || dict["admin.common.private"] || "Private"}</bdi>
            </span>
          )}
          {post.languageCode && (
            <span className="inline-flex items-center rounded border border-[#c3c4c7] bg-[#f0f0f1] px-1.5 py-0.2 text-[10px] font-bold uppercase text-[#50575e]">
              <bdi>{post.languageCode}</bdi>
            </span>
          )}
        </div>

        {/* WordPress Row Actions on Hover */}
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a7aaad] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {!isTrash ? (
            <>
              <Link
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                href={`${basePath}/${post.id}/edit`}
              >
                <bdi>{dict["admin.common.edit"] || "Edit"}</bdi>
              </Link>
              <span aria-hidden="true">|</span>
              <button
                className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
                onClick={onQuickEdit}
                type="button"
              >
                <bdi>{dict["admin.common.quick_edit"] || "Quick Edit"}</bdi>
              </button>
              <span aria-hidden="true">|</span>
              <button
                className="text-[#b32d2e] hover:text-[#8c1617] hover:underline cursor-pointer"
                onClick={onTrash}
                type="button"
              >
                <bdi>{dict["admin.common.trash"] || "Trash"}</bdi>
              </button>
              <span aria-hidden="true">|</span>
              <Link
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                href={`/${post.slug}`}
                target="_blank"
              >
                <bdi>{dict["admin.common.view"] || "View"}</bdi>
              </Link>
            </>
          ) : (
            <>
              <button
                className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
                onClick={onRestore || onTrash}
                type="button"
              >
                <bdi>{dict["admin.common.restore"] || "Restore"}</bdi>
              </button>
              <span aria-hidden="true">|</span>
              <button
                className="text-[#b32d2e] hover:text-[#8c1617] hover:underline cursor-pointer"
                onClick={onDeletePermanently || onTrash}
                type="button"
              >
                <bdi>{dict["admin.common.delete_permanently"] || "Delete permanently"}</bdi>
              </button>
            </>
          )}
        </div>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#2271b1] align-top truncate">
        <bdi>{post.authorName || "—"}</bdi>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#2271b1] align-top break-words">
        {post.categories.length ? (
          <bdi>{post.categories.join(", ")}</bdi>
        ) : (
          "—"
        )}
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top break-words">
        {post.tags.length ? (
          <bdi>{post.tags.join(", ")}</bdi>
        ) : (
          "—"
        )}
      </td>

      <td className="px-3 py-2 text-center align-top">
        {Number(post.commentCount || 0) > 0 ? (
          <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#72777c] px-1.5 py-0.2 text-[10px] font-bold text-white">
            {post.commentCount}
          </span>
        ) : (
          <span className="text-[#a7aaad]">—</span>
        )}
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top leading-normal whitespace-nowrap">
        <span className="text-[#646970] text-[12px] block">
          {post.status === "publish"
            ? dict["admin.posts.published"] || "Published"
            : dict["admin.posts.last_modified"] || "Last Modified"}
        </span>
        <span className="text-[#2c3338]" dir="ltr">
          {formatPostDate(post.date, dict, direction)}
        </span>
      </td>
    </tr>
  );
}
