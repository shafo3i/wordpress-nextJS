import Link from "next/link";

type Counts = {
    all: number;
    approved: number;
    pending: number;
    spam: number;
    trash: number;
};

type Props = {
    currentStatus?: string;
    currentCommentType?: string;
    currentLanguage?: string;
    searchQuery?: string;
    counts: Counts;
    basePath?: string;
    dict?: Record<string, string>;
};

export function CommentFilter({
    currentStatus = "all",
    currentCommentType = "all",
    currentLanguage = "all",
    searchQuery = "",
    counts,
    basePath = "/admincp/comments",
    dict = {},
}: Props) {
    const buildHref = (status?: string) => {
        const params = new URLSearchParams();
        if (status && status !== "all") {
            params.set("status", status);
        }
        if (currentCommentType && currentCommentType !== "all") {
            params.set("comment_type", currentCommentType);
        }
        if (currentLanguage && currentLanguage !== "all") {
            params.set("lang", currentLanguage);
        }
        if (searchQuery && searchQuery.trim().length > 0) {
            params.set("s", searchQuery.trim());
        }
        params.delete("page");
        const suffix = params.toString();
        return `${basePath}${suffix ? `?${suffix}` : ""}`;
    };

    const items = [
        { key: "all", label: dict["admin.comments.filter.all"] || "All", count: counts.all },
        { key: "0", label: dict["admin.comments.filter.pending"] || "Pending", count: counts.pending },
        { key: "1", label: dict["admin.comments.filter.approved"] || "Approved", count: counts.approved },
        { key: "spam", label: dict["admin.comments.filter.spam"] || "Spam", count: counts.spam },
        { key: "trash", label: dict["admin.comments.filter.trash"] || "Trash", count: counts.trash },
    ];

    return (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            {/* Top-Left WordPress Views Nav */}
            <ul className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
                {items.map((item, idx) => {
                    const isActive =
                        (item.key === "all" && (!currentStatus || currentStatus === "all")) ||
                        currentStatus === item.key;
                    return (
                        <li className="inline-flex items-center" key={item.key}>
                            {idx > 0 && <span className="mx-1.5 text-[#c3c4c7]">|</span>}
                            <Link
                                className={
                                    isActive
                                        ? "font-semibold text-[#1d2327]"
                                        : "text-[#2271b1] hover:text-[#135e96] hover:underline"
                                }
                                href={buildHref(item.key)}
                            >
                                {item.label}{" "}
                                <span className="font-normal text-[#646970]">({item.count})</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* Top-Right WordPress Search Bar */}
            <form className="flex items-center gap-1 text-[13px]" method="get">
                {currentStatus && currentStatus !== "all" ? (
                    <input name="status" type="hidden" value={currentStatus} />
                ) : null}
                {currentCommentType && currentCommentType !== "all" ? (
                    <input name="comment_type" type="hidden" value={currentCommentType} />
                ) : null}
                {currentLanguage && currentLanguage !== "all" ? (
                    <input name="lang" type="hidden" value={currentLanguage} />
                ) : null}
                <input
                    className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                    defaultValue={searchQuery}
                    name="s"
                    placeholder={dict["admin.comments.search_placeholder"] || "Search comments..."}
                    type="search"
                />
                <button
                    className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
                    type="submit"
                >
                    {dict["admin.comments.search_button"] || "Search Comments"}
                </button>
            </form>
        </div>
    );
}
