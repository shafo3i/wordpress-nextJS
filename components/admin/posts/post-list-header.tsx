import Link from "next/link";

export function PostListHeader({
  title = "Posts",
  addNewHref = "/admincp/posts/new",
  addNewLabel = "Add New",
  notice,
  onDismissNotice,
}: {
  title?: string;
  addNewHref?: string;
  addNewLabel?: string;
  notice?: { type?: "success" | "warning" | "error"; message: string } | null;
  onDismissNotice?: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">{title}</h1>
          <Link
            className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-0.5 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            href={addNewHref}
          >
            {addNewLabel}
          </Link>
        </div>
        <div className="flex items-center gap-1 text-[13px]">
          <button
            className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            type="button"
          >
            Screen Options <span className="text-[9px]">▼</span>
          </button>
          <button
            className="flex items-center gap-1 rounded-b-[4px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327]"
            type="button"
          >
            Help <span className="text-[9px]">▼</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`relative my-3 flex items-center justify-between border-l-4 bg-white px-3 py-2 text-[13px] shadow-[0_1px_1px_0_rgba(0,0,0,0.04)] ${
            notice.type === "error"
              ? "border-[#d63638] text-[#d63638]"
              : notice.type === "warning"
                ? "border-[#dba617] text-[#614500]"
                : "border-[#00a32a] text-[#1d2327]"
          }`}
        >
          <span>{notice.message}</span>
          {onDismissNotice && (
            <button
              aria-label="Dismiss notice"
              className="text-[#787c82] hover:text-[#1d2327]"
              onClick={onDismissNotice}
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
