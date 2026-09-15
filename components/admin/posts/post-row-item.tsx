import Link from "next/link";
import { MessageSquare } from "lucide-react";

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
};

const STATUS_LABELS: Record<string, string> = {
  publish: "Published",
  draft: "Draft",
  pending: "Pending",
  private: "Private",
  trash: "Trash",
};

function formatPostDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return `${yyyy}/${mm}/${dd} at ${hour12}:${minutes} ${ampm}`;
}

export function PostRowItem({
  post,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onTrash,
  basePath = "/admincp/posts",
}: {
  post: PostRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onTrash: () => void;
  basePath?: string;
}) {
  const isDraft = post.status === "draft";
  const isPendingReview = post.status === "pending";
  const isPrivate = post.status === "private";
  const isTrash = post.status === "trash";

  return (
    <tr className="group border-b border-[#f0f0f1] bg-white hover:bg-[#f6f7f7] last:border-b-0">
      <td className="w-8 px-3 py-2 text-center align-top">
        <input
          aria-label={`Select ${post.title || "post"}`}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          onChange={(e) => onToggleSelect(e.target.checked)}
          type="checkbox"
        />
      </td>

      <td className="px-3 py-2 align-top">
        <div className="flex flex-wrap items-baseline gap-1">
          <Link
            className="text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${post.id}/edit`}
          >
            {post.title || "(no title)"}
          </Link>
          {isDraft && <span className="text-[13px] font-medium text-[#50575e]"> — Draft</span>}
          {isPendingReview && (
            <span className="text-[13px] font-medium text-[#50575e]"> — Pending</span>
          )}
          {isPrivate && (
            <span className="text-[13px] font-medium text-[#50575e]"> — Private</span>
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
                onClick={onTrash}
                type="button"
              >
                Trash
              </button>
              <span>|</span>
              <Link
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                href={`/${post.slug}`}
                target="_blank"
              >
                View
              </Link>
            </>
          ) : (
            <>
              <button
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                onClick={onTrash}
                type="button"
              >
                Restore
              </button>
              <span>|</span>
              <button
                className="text-[#b32d2e] hover:text-[#8c1617] hover:underline"
                onClick={onTrash}
                type="button"
              >
                Delete Permanently
              </button>
            </>
          )}
        </div>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#2271b1] align-top">
        {post.authorName || "—"}
      </td>

      <td className="px-3 py-2 text-[13px] text-[#2271b1] align-top">
        {post.categories.length ? post.categories.join(", ") : "—"}
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top">
        {post.tags.length ? post.tags.join(", ") : "—"}
      </td>

      <td className="px-3 py-2 text-center align-top">
        <span className="inline-flex items-center gap-1 text-xs text-[#50575e]">
          <MessageSquare className="size-3.5 fill-[#72777c] text-transparent" />
          <span className="rounded-full bg-[#72777c] px-1.5 py-0.2 text-[10px] font-bold text-white">
            {post.commentCount || "0"}
          </span>
        </span>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top leading-tight">
        <span className="text-[#646970]">
          {post.status === "publish" ? "Published" : "Last Modified"}
        </span>
        <br />
        <span className="text-[#2c3338]">{formatPostDate(post.date)}</span>
      </td>
    </tr>
  );
}
