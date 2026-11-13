"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { saveQuickDraftAction } from "../actions";

interface DraftItem {
  id: string;
  title: string;
  date: string;
}

interface QuickDraftWidgetProps {
  recentDrafts: DraftItem[];
  dict: Record<string, string>;
}

export function QuickDraftWidget({
  recentDrafts,
  dict,
}: QuickDraftWidgetProps) {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!title && !content) {
      setStatusMessage({
        type: "error",
        text: dict["admin.dashboard.draft_title_placeholder"],
      });
      return;
    }

    startTransition(async () => {
      const res = await saveQuickDraftAction(formData);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: dict["admin.dashboard.draft_saved"],
        });
        formRef.current?.reset();
      } else {
        setStatusMessage({
          type: "error",
          text: dict[res.error || "admin.dashboard.draft_error"],
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-[3px] border p-2.5 text-[12px] ${
            statusMessage.type === "success"
              ? "border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]"
              : "border-[#f5c6cb] bg-[#fcf0f1] text-[#d63638]"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="quick-draft-title" className="sr-only">
            {dict["admin.dashboard.draft_title_placeholder"]}
          </label>
          <input
            id="quick-draft-title"
            name="title"
            maxLength={300}
            type="text"
            placeholder={dict["admin.dashboard.draft_title_placeholder"]}
            className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#1d2327] placeholder:text-[#646970] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="quick-draft-content" className="sr-only">
            {dict["admin.dashboard.draft_content_placeholder"]}
          </label>
          <textarea
            id="quick-draft-content"
            name="content"
            maxLength={100000}
            rows={3}
            placeholder={dict["admin.dashboard.draft_content_placeholder"]}
            className="min-h-[70px] w-full resize-y rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#1d2327] placeholder:text-[#646970] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] bg-[#2271b1] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#135e96] disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            <span>
              {isPending
                ? dict["admin.dashboard.saving_draft"]
                : dict["admin.dashboard.save_draft"]}
            </span>
          </button>

          <Link
            href="/admincp/posts?status=draft"
            className="text-[12px] text-[#2271b1] hover:underline"
          >
            {dict["admin.dashboard.view_all_drafts"]}
          </Link>
        </div>
      </form>

      {/* Recent Drafts List */}
      {recentDrafts.length > 0 && (
        <div className="mt-3 border-t border-[#f0f0f1] pt-3">
          <h4 className="mb-2 text-[12px] font-semibold tracking-wider text-[#50575e] uppercase">
            {dict["admin.dashboard.recent_drafts"]}
          </h4>
          <ul className="space-y-1.5">
            {recentDrafts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-center justify-between gap-2 text-[13px]"
              >
                <Link
                  href={`/admincp/posts/${draft.id}/edit`}
                  className="flex max-w-[200px] items-center gap-1.5 truncate text-[#2271b1] hover:underline"
                >
                  <FileText className="size-3 shrink-0 text-[#646970]" />
                  <span className="truncate">
                    {draft.title || dict["admin.dashboard.untitled"]}
                  </span>
                </Link>
                <span className="shrink-0 text-[11px] text-[#646970]">
                  {draft.date}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
