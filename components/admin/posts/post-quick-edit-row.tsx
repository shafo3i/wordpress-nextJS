"use client";

import { useState, useTransition } from "react";
import { quickUpdatePost } from "@/app/(admin)/admincp/posts/actions";
import type { CategoryOption } from "./post-tablenav";

const MONTH_NAMES = [
  "01-Jan",
  "02-Feb",
  "03-Mar",
  "04-Apr",
  "05-May",
  "06-Jun",
  "07-Jul",
  "08-Aug",
  "09-Sep",
  "10-Oct",
  "11-Nov",
  "12-Dec",
];

export type PostQuickEditProps = {
  post: {
    id: string;
    title: string;
    slug: string;
    status: string;
    date: string;
    categorySlugs?: string[];
    tags?: string[];
    commentStatus?: string;
    pingStatus?: string;
    postPassword?: string;
  };
  categories: CategoryOption[];
  onCancel: () => void;
  onSuccess: (updated: { id: string; title: string; slug: string; status: string; date: string }) => void;
};

export function PostQuickEditRow({
  post,
  categories,
  onCancel,
  onSuccess,
}: PostQuickEditProps) {
  const [title, setTitle] = useState(post.title || "");
  const [slug, setSlug] = useState(post.slug || "");
  const [status, setStatus] = useState(post.status || "draft");
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(
    post.categorySlugs ?? [],
  );
  const [tags, setTags] = useState((post.tags ?? []).join(", "));
  const [allowComments, setAllowComments] = useState(post.commentStatus !== "closed");
  const [allowPings, setAllowPings] = useState(post.pingStatus !== "closed");
  const [password, setPassword] = useState(post.postPassword || "");
  const [isPrivate, setIsPrivate] = useState(post.status === "private");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialDate = new Date(post.date || Date.now());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [day, setDay] = useState(initialDate.getDate());
  const [year, setYear] = useState(initialDate.getFullYear());
  const [hour, setHour] = useState(initialDate.getHours());
  const [minute, setMinute] = useState(initialDate.getMinutes());

  const [isPending, startTransition] = useTransition();

  const toggleCategory = (slugVal: string, checked: boolean) => {
    setSelectedCategorySlugs((curr) =>
      checked ? [...new Set([...curr, slugVal])] : curr.filter((s) => s !== slugVal),
    );
  };

  const handleUpdate = () => {
    setErrorMessage(null);
    if (!title.trim()) {
      setErrorMessage("Post title cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        const computedDate = new Date(year, month, day, hour, minute);
        const resolvedStatus = isPrivate ? "private" : status;

        const res = await quickUpdatePost({
          id: post.id,
          title: title.trim(),
          slug: slug.trim(),
          status: resolvedStatus,
          date: !Number.isNaN(computedDate.getTime()) ? computedDate.toISOString() : undefined,
          categorySlugs: selectedCategorySlugs,
          tags,
          commentStatus: allowComments ? "open" : "closed",
          pingStatus: allowPings ? "open" : "closed",
          postPassword: isPrivate ? "" : password,
        });

        if (res?.success) {
          onSuccess(res);
        } else {
          setErrorMessage("Failed to update post.");
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Error saving post.");
      }
    });
  };

  return (
    <tr className="border-y-2 border-[#2271b1] bg-[#f6f7f7]">
      <td className="p-3" colSpan={7}>
        <div className="space-y-3 text-[13px] text-[#2c3338]">
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#1d2327]">
            QUICK EDIT
          </h4>

          {errorMessage && (
            <div className="rounded border border-[#d63638] bg-[#fcf0f1] px-3 py-1.5 text-xs text-[#d63638]">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left Column: Title, Slug, Date, Password */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#50575e]">Title</label>
                <input
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  value={title}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#50575e]">Slug</label>
                <input
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                  onChange={(e) => setSlug(e.target.value)}
                  type="text"
                  value={slug}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#50575e]">Date</label>
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <select
                    className="h-[28px] rounded-[3px] border border-[#8c8f94] bg-white px-1 text-xs"
                    onChange={(e) => setMonth(Number(e.target.value))}
                    value={month}
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Day"
                    className="h-[28px] w-12 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-xs"
                    max={31}
                    min={1}
                    onChange={(e) => setDay(Number(e.target.value))}
                    type="number"
                    value={day}
                  />
                  <span>,</span>
                  <input
                    aria-label="Year"
                    className="h-[28px] w-16 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-xs"
                    onChange={(e) => setYear(Number(e.target.value))}
                    type="number"
                    value={year}
                  />
                  <span>@</span>
                  <input
                    aria-label="Hour"
                    className="h-[28px] w-12 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-xs"
                    max={23}
                    min={0}
                    onChange={(e) => setHour(Number(e.target.value))}
                    type="number"
                    value={hour}
                  />
                  <span>:</span>
                  <input
                    aria-label="Minute"
                    className="h-[28px] w-12 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-xs"
                    max={59}
                    min={0}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    type="number"
                    value={minute}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-[#50575e]">
                    Password
                  </label>
                  <input
                    className="h-[28px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] disabled:opacity-50"
                    disabled={isPrivate}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    type="text"
                    value={password}
                  />
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs">
                  <span className="text-[#646970]">–OR–</span>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      type="checkbox"
                    />
                    <span>Private</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Center Column: Categories checklist */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#50575e]">
                Categories
              </label>
              <div className="max-h-44 overflow-y-auto rounded-[3px] border border-[#8c8f94] bg-white p-2 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset]">
                {categories.length ? (
                  categories.map((cat) => (
                    <label
                      className="flex items-center gap-1.5 py-0.5 text-xs hover:bg-[#f0f6fc]"
                      key={cat.slug}
                    >
                      <input
                        checked={selectedCategorySlugs.includes(cat.slug)}
                        onChange={(e) => toggleCategory(cat.slug, e.target.checked)}
                        type="checkbox"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))
                ) : (
                  <span className="text-[#646970]">No categories found.</span>
                )}
              </div>
            </div>

            {/* Right Column: Tags, Comments/Pings, Status */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#50575e]">
                  Tags
                </label>
                <textarea
                  className="w-full rounded-[3px] border border-[#8c8f94] bg-white p-1.5 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Separate tags with commas"
                  rows={2}
                  value={tags}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    type="checkbox"
                  />
                  <span>Allow Comments</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    checked={allowPings}
                    onChange={(e) => setAllowPings(e.target.checked)}
                    type="checkbox"
                  />
                  <span>Allow Pings</span>
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#50575e]">
                  Status
                </label>
                <select
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] disabled:opacity-50"
                  disabled={isPrivate}
                  onChange={(e) => setStatus(e.target.value)}
                  value={isPrivate ? "private" : status}
                >
                  <option value="publish">Published</option>
                  <option value="pending">Pending Review</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#dcdcde] pt-3">
            <button
              className="rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 py-1 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1 text-[13px] font-medium text-white hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50"
              disabled={isPending}
              onClick={handleUpdate}
              type="button"
            >
              {isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
