"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export type LanguageOption = {
    code: string;
    name: string;
    nativeName?: string | null;
};

export function CommentTablenav({
    position = "top",
    bulkAction,
    onBulkActionChange,
    onApplyBulkAction,
    isPending = false,
    currentCommentType = "all",
    languages = [],
    currentLanguage = "all",
    totalItems = 0,
    currentPage = 1,
    totalPages = 1,
    basePath = "/admincp/comments",
    queryString = "",
    currentStatus = "all",
    dict = {},
}: {
    position?: "top" | "bottom";
    bulkAction: string;
    onBulkActionChange: (action: string) => void;
    onApplyBulkAction: () => void;
    isPending?: boolean;
    currentCommentType?: string;
    languages?: LanguageOption[];
    currentLanguage?: string;
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    basePath?: string;
    queryString?: string;
    currentStatus?: string;
    dict?: Record<string, string>;
}) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState(currentCommentType ?? "all");
    const [selectedLang, setSelectedLang] = useState(currentLanguage ?? "all");

    const validTotalPages = Math.max(1, totalPages);
    const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

    const buildHref = (pageNumber: number) => {
        const params = new URLSearchParams(queryString);
        params.set("page", String(pageNumber));
        const suffix = params.toString();
        return `${basePath}${suffix ? `?${suffix}` : ""}`;
    };

    const handleFilter = () => {
        const params = new URLSearchParams(queryString);
        if (selectedType && selectedType !== "all") {
            params.set("comment_type", selectedType);
        } else {
            params.delete("comment_type");
        }
        if (selectedLang && selectedLang !== "all") {
            params.set("lang", selectedLang);
        } else {
            params.delete("lang");
        }
        params.delete("page");
        const suffix = params.toString();
        router.push(`${basePath}${suffix ? `?${suffix}` : ""}`);
    };

    const isTrash = currentStatus === "trash";

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#50575e] ${
                position === "top" ? "mb-2" : "mt-3"
            }`}
        >
            <div className="flex flex-wrap items-center gap-1.5">
                <select
                    aria-label={dict["admin.common.bulk_actions"] || "Bulk actions"}
                    className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                    onChange={(e) => onBulkActionChange(e.target.value)}
                    value={bulkAction}
                >
                    <option value="Bulk actions">{dict["admin.common.bulk_actions"] || "Bulk actions"}</option>
                    {!isTrash ? (
                        <>
                            {currentStatus !== "0" && (
                                <option value="unapprove">
                                    {dict["admin.comments.bulk.unapprove"] || "Unapprove"}
                                </option>
                            )}
                            {currentStatus !== "1" && (
                                <option value="approve">
                                    {dict["admin.comments.bulk.approve"] || "Approve"}
                                </option>
                            )}
                            {currentStatus !== "spam" && (
                                <option value="spam">
                                    {dict["admin.comments.bulk.spam"] || "Mark as Spam"}
                                </option>
                            )}
                            <option value="trash">
                                {dict["admin.comments.bulk.trash"] || "Move to Trash"}
                            </option>
                        </>
                    ) : (
                        <>
                            <option value="restore">
                                {dict["admin.comments.bulk.restore"] || "Restore"}
                            </option>
                            <option value="delete">
                                {dict["admin.comments.bulk.delete"] || "Delete permanently"}
                            </option>
                        </>
                    )}
                </select>

                <button
                    className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50 cursor-pointer"
                    disabled={isPending || bulkAction === "Bulk actions"}
                    onClick={onApplyBulkAction}
                    type="button"
                >
                    {isPending
                        ? dict["admin.common.applying"] || "Applying..."
                        : dict["admin.common.apply"] || "Apply"}
                </button>

                {position === "top" && (
                    <>
                        <select
                            aria-label={dict["admin.comments.type.filter_label"] || "Filter by comment type"}
                            className="ms-2 h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                            onChange={(e) => setSelectedType(e.target.value)}
                            value={selectedType}
                        >
                            <option value="all">
                                {dict["admin.comments.type.all"] || "All comment types"}
                            </option>
                            <option value="comment">
                                {dict["admin.comments.type.comments"] || "Comments"}
                            </option>
                            <option value="pings">
                                {dict["admin.comments.type.pings"] || "Pings"}
                            </option>
                        </select>

                        {languages.length > 0 && (
                            <select
                                aria-label={dict["admin.common.filter_by_language"] || "Filter by language"}
                                className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                                onChange={(e) => setSelectedLang(e.target.value)}
                                value={selectedLang}
                            >
                                <option value="all">
                                    {dict["admin.common.all_languages"] || "All languages"}
                                </option>
                                {languages.map((l) => (
                                    <option key={l.code} value={l.code}>
                                        {l.nativeName ? `${l.name} (${l.nativeName})` : l.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <button
                            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
                            onClick={handleFilter}
                            type="button"
                        >
                            {dict["admin.common.filter"] || "Filter"}
                        </button>
                    </>
                )}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[13px] text-[#646970]">
                    {totalItems} {dict["admin.pagination.comments"] || "comments"}
                </span>

                <div className="flex items-center gap-1">
                    <span className="mx-1 text-[13px] text-[#646970]">
                        {validCurrentPage} {dict["admin.pagination.of"] || "of"} {validTotalPages}
                    </span>
                    {validCurrentPage > 1 ? (
                        <Link
                            aria-label={dict["admin.pagination.first"] || "First page"}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                            href={buildHref(1)}
                        >
                            <ChevronsLeft className="size-3.5 rtl:rotate-180" />
                        </Link>
                    ) : (
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                            <ChevronsLeft className="size-3.5 rtl:rotate-180" />
                        </span>
                    )}
                    {validCurrentPage > 1 ? (
                        <Link
                            aria-label={dict["admin.pagination.prev"] || "Previous page"}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                            href={buildHref(validCurrentPage - 1)}
                        >
                            <ChevronLeft className="size-3.5 rtl:rotate-180" />
                        </Link>
                    ) : (
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                            <ChevronLeft className="size-3.5 rtl:rotate-180" />
                        </span>
                    )}
                    {validCurrentPage < validTotalPages ? (
                        <Link
                            aria-label={dict["admin.pagination.next"] || "Next page"}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                            href={buildHref(validCurrentPage + 1)}
                        >
                            <ChevronRight className="size-3.5 rtl:rotate-180" />
                        </Link>
                    ) : (
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                            <ChevronRight className="size-3.5 rtl:rotate-180" />
                        </span>
                    )}
                    {validCurrentPage < validTotalPages ? (
                        <Link
                            aria-label={dict["admin.pagination.last"] || "Last page"}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                            href={buildHref(validTotalPages)}
                        >
                            <ChevronsRight className="size-3.5 rtl:rotate-180" />
                        </Link>
                    ) : (
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                            <ChevronsRight className="size-3.5 rtl:rotate-180" />
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
