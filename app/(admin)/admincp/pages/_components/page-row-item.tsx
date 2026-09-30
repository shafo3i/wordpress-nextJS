"use client";

import Link from "next/link";
import { MessageSquare, Pencil, Plus } from "lucide-react";

export type PageRowData = {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorName: string;
  commentCount: string;
  date: string;
  postParent?: string;
  menuOrder?: number;
  commentStatus?: string;
  postPassword?: string;
  languageCode?: string;
  translationGroupId?: string;
  translations?: {
    languageCode: string;
    postId: string;
    title: string;
  }[];
};

function formatPageDate(value: string) {
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

export function PageRowItem({
  page,
  isSelected,
  onToggleSelect,
  onQuickEdit,
  onTrash,
  onRestore,
  onDeletePermanently,
  basePath = "/admincp/pages",
  languages = [],
  dict = {},
  direction = "ltr",
}: {
  page: PageRowData;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onQuickEdit: () => void;
  onTrash: () => void;
  onRestore?: () => void;
  onDeletePermanently?: () => void;
  basePath?: string;
  languages?: { code: string; name: string; nativeName?: string }[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const isDraft = page.status === "draft";
  const isPendingReview = page.status === "pending";
  const isPrivate = page.status === "private";
  const isTrash = page.status === "trash";
  const hasParent = page.postParent && page.postParent !== "0";

  return (
    <tr className="group border-b border-[#f0f0f1] bg-white hover:bg-[#f6f7f7] last:border-b-0 text-start">
      <td className="w-8 px-3 py-2 text-center align-top">
        <input
          aria-label={`Select ${page.title || "page"}`}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
          onChange={(e) => onToggleSelect(e.target.checked)}
          type="checkbox"
        />
      </td>

      <td className="px-3 py-2 align-top">
        <div className="flex flex-wrap items-baseline gap-1">
          {hasParent && <span className="text-[#8c8f94]">—— </span>}
          <Link
            className="text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline"
            href={`${basePath}/${page.id}/edit`}
          >
            {page.title || dict["admin.pages.no_title"] || "(no title)"}
          </Link>
          {isDraft && (
            <span className="text-[13px] font-medium text-[#50575e]">
              {" "}— {dict["admin.common.draft"] || "Draft"}
            </span>
          )}
          {isPendingReview && (
            <span className="text-[13px] font-medium text-[#50575e]">
              {" "}— {dict["admin.common.pending"] || "Pending"}
            </span>
          )}
          {isPrivate && (
            <span className="text-[13px] font-medium text-[#50575e]">
              {" "}— {dict["admin.common.private"] || "Private"}
            </span>
          )}
        </div>

        {/* WordPress Row Actions on Hover */}
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a7aaad] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {!isTrash ? (
            <>
              <Link
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                href={`${basePath}/${page.id}/edit`}
              >
                {dict["admin.common.edit"] || "Edit"}
              </Link>
              <span>|</span>
              <button
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                onClick={onQuickEdit}
                type="button"
              >
                {dict["admin.common.quick_edit"] || "Quick Edit"}
              </button>
              <span>|</span>
              <button
                className="text-[#b32d2e] hover:text-[#8c1617] hover:underline"
                onClick={onTrash}
                type="button"
              >
                {dict["admin.common.trash"] || "Trash"}
              </button>
              <span>|</span>
              <Link
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                href={`/${page.slug}`}
                target="_blank"
              >
                {dict["admin.common.view"] || "View"}
              </Link>
            </>
          ) : (
            <>
              <button
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                onClick={onRestore || onTrash}
                type="button"
              >
                {dict["admin.common.restore"] || "Restore"}
              </button>
              <span>|</span>
              <button
                className="text-[#b32d2e] hover:text-[#8c1617] hover:underline"
                onClick={onDeletePermanently || onTrash}
                type="button"
              >
                {dict["admin.common.delete_permanently"] || "Delete Permanently"}
              </button>
            </>
          )}
        </div>
      </td>

      {/* Multi-language / Translations Column */}
      {languages.length > 0 && (
        <td className="px-3 py-2 align-top">
          <div className="flex items-center gap-2">
            {page.languageCode ? (
              <span className="inline-flex items-center rounded bg-[#f0f0f1] px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase text-[#50575e]">
                {page.languageCode}
              </span>
            ) : (
              <span className="text-[12px] text-[#a7aaad]">—</span>
            )}

            {/* Translation Links for other languages */}
            <div className="flex items-center gap-1.5">
              {languages
                .filter((l) => l.code !== page.languageCode)
                .map((l) => {
                  const existingTrans = page.translations?.find(
                    (t) => t.languageCode === l.code
                  );
                  if (existingTrans) {
                    return (
                      <Link
                        key={l.code}
                        href={`${basePath}/${existingTrans.postId}/edit`}
                        title={`Edit ${l.name} translation: ${existingTrans.title}`}
                        className="inline-flex items-center text-[#2271b1] hover:text-[#135e96]"
                      >
                        <Pencil className="size-3 text-[#2271b1]" />
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={l.code}
                      href={`${basePath}/new?lang=${l.code}&translation_of=${page.id}`}
                      title={`Add translation in ${l.name}`}
                      className="inline-flex items-center text-[#a7aaad] hover:text-[#2271b1]"
                    >
                      <Plus className="size-3 text-[#8c8f94] hover:text-[#2271b1]" />
                    </Link>
                  );
                })}
            </div>
          </div>
        </td>
      )}

      <td className="px-3 py-2 text-[13px] text-[#2271b1] align-top">
        {page.authorName || "—"}
      </td>

      <td className="px-3 py-2 text-center align-top">
        <span className="inline-flex items-center gap-1 text-xs text-[#50575e]">
          <MessageSquare className="size-3.5 fill-[#72777c] text-transparent" />
          <span className="rounded-full bg-[#72777c] px-1.5 py-0.2 text-[10px] font-bold text-white">
            {page.commentCount || "0"}
          </span>
        </span>
      </td>

      <td className="px-3 py-2 text-[13px] text-[#50575e] align-top whitespace-nowrap">
        {page.status === "publish"
          ? dict["admin.pages.published"] || "Published"
          : dict["admin.pages.last_modified"] || "Last Modified"}
        <br />
        <span className="text-[12px] text-[#646970]">{formatPageDate(page.date)}</span>
      </td>
    </tr>
  );
}
