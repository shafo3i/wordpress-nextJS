"use client";

import { useState, useTransition } from "react";
import { quickUpdatePageAction } from "../action";

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

export type PageQuickEditProps = {
  page: {
    id: string;
    title: string;
    slug: string;
    status: string;
    date: string;
    postParent?: string;
    menuOrder?: number;
    commentStatus?: string;
    postPassword?: string;
  };
  parentPages?: { id: string; title: string }[];
  onCancel: () => void;
  onSuccess: (updated: {
    id: string;
    title: string;
    slug: string;
    status: string;
    date: string;
  }) => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  colSpan?: number;
};

export function PageQuickEditRow({
  page,
  parentPages = [],
  onCancel,
  onSuccess,
  dict = {},
  direction = "ltr",
  colSpan = 7,
}: PageQuickEditProps) {
  const [title, setTitle] = useState(page.title || "");
  const [slug, setSlug] = useState(page.slug || "");
  const [status, setStatus] = useState(page.status || "draft");
  const [postParent, setPostParent] = useState(page.postParent || "0");
  const [menuOrder, setMenuOrder] = useState(page.menuOrder ?? 0);
  const [allowComments, setAllowComments] = useState(page.commentStatus === "open");
  const [password, setPassword] = useState(page.postPassword || "");
  const [isPrivate, setIsPrivate] = useState(page.status === "private");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialDate = new Date(page.date || Date.now());
  const validInitialDate = Number.isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [month, setMonth] = useState(validInitialDate.getMonth());
  const [day, setDay] = useState(validInitialDate.getDate());
  const [year, setYear] = useState(validInitialDate.getFullYear());
  const [hour, setHour] = useState(validInitialDate.getHours());
  const [minute, setMinute] = useState(validInitialDate.getMinutes());

  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const dateObj = new Date(year, month, day, hour, minute);
        const resolvedStatus = isPrivate ? "private" : status;

        const res = await quickUpdatePageAction({
          id: page.id,
          title,
          slug,
          date: dateObj.toISOString(),
          status: resolvedStatus as any,
          postParent,
          menuOrder,
          commentStatus: allowComments ? "open" : "closed",
          postPassword: password,
        });

        if (res.success && "id" in res && res.id) {
          onSuccess({
            id: res.id,
            title: res.title || title,
            slug: res.slug || slug,
            status: res.status || resolvedStatus,
            date: res.date || dateObj.toISOString(),
          });
        } else {
          setErrorMessage(
            ("error" in res && typeof res.error === "string" ? res.error : null) ||
              dict["admin.common.failed_notice"] ||
              "Failed to update page."
          );
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Failed to update page.");
      }
    });
  };

  return (
    <tr className="border-y-2 border-[#2271b1] bg-[#f6f7f7] text-start" dir={direction}>
      <td colSpan={colSpan} className="p-3">
        <div className="space-y-3 text-[13px] text-[#2c3338]">
          <div className="flex items-center justify-between border-b border-[#dcdcde] pb-2">
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-[#1d2327]">
              {dict["admin.common.quick_edit"] || "Quick Edit"}
            </h4>
            {errorMessage && (
              <span className="text-[12px] text-[#d63638] font-medium">{errorMessage}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] text-[#2c3338]">
            {/* Column 1: Title, Slug, Date */}
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.pages.table.title"] || "Title"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.pages.slug"] || "Slug"}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  dir="ltr"
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.posts.table.date"] || "Date"}
                </label>
                <div className="flex flex-wrap items-center gap-1 text-[12px]" dir="ltr">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="h-[28px] rounded-[3px] border border-[#8c8f94] bg-white px-1 text-[12px]"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="h-[28px] w-12 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-[12px]"
                    min={1}
                    max={31}
                  />
                  <span>,</span>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="h-[28px] w-16 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-[12px]"
                  />
                  <span>@</span>
                  <input
                    type="number"
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="h-[28px] w-12 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-[12px]"
                    min={0}
                    max={23}
                  />
                  <span>:</span>
                  <input
                    type="number"
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    className="h-[28px] w-12 rounded-[3px] border border-[#8c8f94] bg-white px-1 text-center text-[12px]"
                    min={0}
                    max={59}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Parent, Order */}
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.pages.parent"] || "Parent"}
                </label>
                <select
                  value={postParent}
                  onChange={(e) => setPostParent(e.target.value)}
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                >
                  <option value="0">{dict["admin.pages.no_parent"] || "(no parent)"}</option>
                  {parentPages
                    .filter((p) => p.id !== page.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.pages.order"] || "Order"}
                </label>
                <input
                  type="number"
                  value={menuOrder}
                  onChange={(e) => setMenuOrder(Number(e.target.value))}
                  className="h-[30px] w-24 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="text-[12px] font-medium text-[#2c3338]">
                    {dict["admin.pages.allow_comments"] || "Allow Comments"}
                  </span>
                </label>
              </div>
            </div>

            {/* Column 3: Password / Private, Status */}
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.pages.password"] || "Password"}
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPrivate}
                  placeholder={dict["admin.pages.password_placeholder"] || "Or make it private"}
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none disabled:bg-[#f6f7f7] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  />
                  <span className="text-[12px] font-medium text-[#2c3338]">
                    {dict["admin.pages.private_checkbox"] || "Private page"}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#50575e] mb-1">
                  {dict["admin.posts.table.status"] || "Status"}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isPrivate}
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none disabled:bg-[#f6f7f7] disabled:opacity-60"
                >
                  <option value="publish">{dict["admin.common.published"] || "Published"}</option>
                  <option value="pending">{dict["admin.common.pending"] || "Pending Review"}</option>
                  <option value="draft">{dict["admin.common.draft"] || "Draft"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-[#dcdcde] pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 py-1 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            >
              {dict["admin.common.cancel"] || "Cancel"}
            </button>
            <button
              type="button"
              disabled={isPending || !title.trim()}
              onClick={handleUpdate}
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1 text-[13px] font-medium text-white hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50"
            >
              {isPending
                ? dict["admin.common.saving"] || "Updating..."
                : dict["admin.common.update"] || "Update"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
