"use client";

import { absoluteWebUrl } from "@/lib/seo/urls";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CommentWithPost } from "../query";
import {
    bulkDeleteComments,
    bulkUpdateCommentStatus,
    deleteCommentAction,
    updateCommentStatusAction,
} from "../action";
import { CommentStatusBadge } from "./comment-status-badge";
import { CommentTablenav, type LanguageOption } from "./comment-tablenav";

type Props = {
    rows: CommentWithPost[];
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    pageSize?: number;
    currentStatus?: string;
    currentCommentType?: string;
    languages?: LanguageOption[];
    currentLanguage?: string;
    searchQuery?: string;
    dict?: Record<string, string>;
};

export default function CommentTable({
    rows = [],
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    currentStatus = "all",
    currentCommentType = "all",
    languages = [],
    currentLanguage = "all",
    searchQuery = "",
    dict = {},
}: Props) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState("Bulk actions");
    const [notice, setNotice] = useState<{
        type?: "success" | "warning" | "error";
        message: string;
    } | null>(null);
    const [isPending, startTransition] = useTransition();

    const allSelected = rows.length > 0 && selectedIds.length === rows.length;

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? rows.map((r) => r.commentId.toString()) : []);
    };

    const toggleSelectOne = (id: string, checked: boolean) => {
        setSelectedIds((curr) =>
            checked ? [...new Set([...curr, id])] : curr.filter((i) => i !== id)
        );
    };

    const handleApplyBulkAction = () => {
        if (!selectedIds.length || bulkAction === "Bulk actions") return;

        startTransition(async () => {
            try {
                if (bulkAction === "approve") {
                    const result = await bulkUpdateCommentStatus(selectedIds, "1");
                    setNotice({
                        type: "success",
                        message: `${result.count} ${
                            dict["admin.comments.bulk.approved_notice"] || ""
                        }`,
                    });
                } else if (bulkAction === "unapprove") {
                    const result = await bulkUpdateCommentStatus(selectedIds, "0");
                    setNotice({
                        type: "success",
                        message: `${result.count} ${
                            dict["admin.comments.bulk.unapproved_notice"] || ""
                        }`,
                    });
                } else if (bulkAction === "spam") {
                    const result = await bulkUpdateCommentStatus(selectedIds, "spam");
                    setNotice({
                        type: "success",
                        message: `${result.count} ${
                            dict["admin.comments.bulk.spam_notice"] || ""
                        }`,
                    });
                } else if (bulkAction === "trash") {
                    const result = await bulkUpdateCommentStatus(selectedIds, "trash");
                    setNotice({
                        type: "success",
                        message: `${result.count} ${
                            dict["admin.comments.bulk.trash_notice"] || ""
                        }`,
                    });
                } else if (bulkAction === "restore") {
                    const result = await bulkUpdateCommentStatus(selectedIds, "0");
                    setNotice({
                        type: "success",
                        message: `${result.count} ${
                            dict["admin.comments.bulk.restored_notice"] || ""
                        }`,
                    });
                } else if (bulkAction === "delete") {
                    const result = await bulkDeleteComments(selectedIds);
                    setNotice({
                        type: "success",
                        message: `${result.count} ${
                            dict["admin.comments.bulk.deleted_notice"] || ""
                        }`,
                    });
                }
                setSelectedIds([]);
                setBulkAction("Bulk actions");
                router.refresh();
            } catch {
                const message = dict["admin.comments.error.failed"] || "";
                setNotice({
                    type: "error",
                    message,
                });
            }
        });
    };

    const queryParams = new URLSearchParams();
    if (currentStatus && currentStatus !== "all") queryParams.set("status", currentStatus);
    if (currentCommentType && currentCommentType !== "all") queryParams.set("comment_type", currentCommentType);
    if (currentLanguage && currentLanguage !== "all") queryParams.set("lang", currentLanguage);
    if (searchQuery) queryParams.set("s", searchQuery);
    const queryString = queryParams.toString();

    return (
        <div>
            {/* Action Notice */}
            {notice && (
                <div
                    className={`relative my-2.5 flex items-center justify-between border-s-4 bg-white px-3 py-2 text-[13px] shadow-[0_1px_1px_0_rgba(0,0,0,0.04)] ${
                        notice.type === "error"
                            ? "border-[#d63638] text-[#d63638]"
                            : notice.type === "warning"
                            ? "border-[#dba617] text-[#614500]"
                            : "border-[#00a32a] text-[#1d2327]"
                    }`}
                >
                    <span>{notice.message}</span>
                    <button
                        aria-label={dict["admin.comments.dismiss_notice"] || ""}
                        className="text-[#787c82] hover:text-[#1d2327] cursor-pointer"
                        onClick={() => setNotice(null)}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Top Tablenav (Bulk Actions, Type Filter, Language Filter, Pagination) */}
            <CommentTablenav
                basePath="/admincp/comments"
                bulkAction={bulkAction}
                currentCommentType={currentCommentType}
                currentLanguage={currentLanguage}
                currentPage={currentPage}
                currentStatus={currentStatus}
                dict={dict}
                isPending={isPending}
                languages={languages}
                onApplyBulkAction={handleApplyBulkAction}
                onBulkActionChange={setBulkAction}
                position="top"
                queryString={queryString}
                totalItems={totalItems}
                totalPages={totalPages}
            />

            {/* Widefat Table */}
            <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <table className="w-full min-w-[760px] border-collapse text-start text-[13px]">
                    <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                        <tr>
                            <th className="w-8 px-2 py-2 text-center">
                                <input
                                    aria-label={dict["admin.common.select_all"] || ""}
                                    checked={allSelected}
                                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    type="checkbox"
                                />
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.author"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.comment"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.response_to"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.status"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.submitted"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.actions"] || ""}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-[#646970]">
                                    {dict["admin.comments.table.no_comments"] || ""}
                                </td>
                            </tr>
                        ) : (
                            rows.map((comment) => {
                                const idStr = comment.commentId.toString();
                                const authorUrl = absoluteWebUrl(comment.commentAuthorUrl);
                                const isChecked = selectedIds.includes(idStr);
                                return (
                                    <tr
                                        key={idStr}
                                        className={`transition-colors ${
                                            isChecked ? "bg-[#f0f6fc]" : "hover:bg-[#f6f7f7]"
                                        }`}
                                    >
                                        {/* Row Checkbox */}
                                        <td className="w-8 px-2 py-2.5 text-center align-top">
                                            <input
                                                aria-label={`${dict["admin.common.select"] || ""} ${idStr}`}
                                                checked={isChecked}
                                                className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                                onChange={(e) =>
                                                    toggleSelectOne(idStr, e.target.checked)
                                                }
                                                type="checkbox"
                                            />
                                        </td>

                                        {/* Author Details */}
                                        <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                            <div className="font-semibold text-[#1d2327]">
                                                {comment.commentAuthor || dict["admin.comments.anonymous"] || ""}
                                            </div>
                                            {comment.commentAuthorEmail && (
                                                <div className="text-xs text-[#2271b1] truncate max-w-[180px]">
                                                    <a
                                                        href={`mailto:${encodeURIComponent(comment.commentAuthorEmail)}`}
                                                        className="hover:underline"
                                                    >
                                                        {comment.commentAuthorEmail}
                                                    </a>
                                                </div>
                                            )}
                                            {authorUrl && (
                                                <div className="text-xs text-[#2271b1] truncate max-w-[180px]">
                                                    <a
                                                        href={authorUrl}
                                                        target="_blank"
                                                        rel="ugc nofollow noopener noreferrer"
                                                        className="hover:underline"
                                                    >
                                                        {comment.commentAuthorUrl}
                                                    </a>
                                                </div>
                                            )}
                                            {comment.commentAuthorIp && (
                                                <div className="text-[11px] text-[#646970]">
                                                    IP: {comment.commentAuthorIp}
                                                </div>
                                            )}
                                        </td>

                                        {/* Comment Content */}
                                        <td className="px-3 py-2.5 align-top">
                                            <div className="text-[13px] text-[#2c3338] line-clamp-4 max-w-md whitespace-pre-wrap leading-relaxed">
                                                {comment.commentContent}
                                            </div>
                                        </td>

                                        {/* In Response To (Post Link) */}
                                        <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                            {comment.commentPostId ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <Link
                                                        href={`/admincp/${comment.postType === "page" ? "pages" : "posts"}/${comment.commentPostId}/edit`}
                                                        className="text-[13px] font-medium text-[#2271b1] hover:text-[#0a4b78] hover:underline max-w-[200px] truncate"
                                                        title={comment.postTitle || ""}
                                                    >
                                                        {comment.postTitle || dict["admin.comments.deleted_post"] || ""}
                                                    </Link>
                                                    {comment.postSlug && (
                                                        <Link
                                                            href={`${comment.postType === "page" ? "/" : "/posts/"}${encodeURIComponent(comment.postSlug || "")}`}
                                                            target="_blank"
                                                            rel="ugc nofollow noopener noreferrer"
                                                            className="text-[11px] text-[#646970] hover:text-[#2271b1] hover:underline"
                                                        >
                                                            {dict["admin.comments.view_post"] || ""} ↗
                                                        </Link>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[#a7aaad]">—</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                            <CommentStatusBadge
                                                dict={dict}
                                                status={comment.commentApproved}
                                            />
                                        </td>

                                        {/* Submitted Date */}
                                        <td className="px-3 py-2.5 align-top whitespace-nowrap text-[12px] text-[#646970]">
                                            <div>{new Date(comment.commentDate).toLocaleDateString()}</div>
                                            <div className="text-[11px] text-[#8c8f94]">
                                                {new Date(comment.commentDate).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </td>

                                        {/* Action Buttons */}
                                        <td className="px-3 py-2.5 align-top whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-[12px]">
                                                <div className="flex items-center gap-2">
                                                    {/* Edit */}
                                                    <Link
                                                        href={`/admincp/comments?edit=${idStr}`}
                                                        className="text-[#2271b1] hover:text-[#0a4b78] font-medium underline"
                                                    >
                                                        {dict["admin.comments.table.edit"] || ""}
                                                    </Link>

                                                    {/* Quick Moderate: Approve / Unapprove */}
                                                    {comment.commentApproved !== "1" ? (
                                                        <form action={updateCommentStatusAction}>
                                                            <input
                                                                type="hidden"
                                                                name="commentId"
                                                                value={idStr}
                                                            />
                                                            <input type="hidden" name="status" value="1" />
                                                            <button
                                                                type="submit"
                                                                className="text-[#007017] hover:text-[#005110] font-medium underline cursor-pointer"
                                                            >
                                                                {dict["admin.comments.table.approve"] || ""}
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <form action={updateCommentStatusAction}>
                                                            <input
                                                                type="hidden"
                                                                name="commentId"
                                                                value={idStr}
                                                            />
                                                            <input type="hidden" name="status" value="0" />
                                                            <button
                                                                type="submit"
                                                                className="text-[#996800] hover:text-[#704d00] font-medium underline cursor-pointer"
                                                            >
                                                                {dict["admin.comments.table.unapprove"] || ""}
                                                            </button>
                                                        </form>
                                                    )}

                                                    {/* Spam Toggle */}
                                                    {comment.commentApproved !== "spam" && (
                                                        <form action={updateCommentStatusAction}>
                                                            <input
                                                                type="hidden"
                                                                name="commentId"
                                                                value={idStr}
                                                            />
                                                            <input type="hidden" name="status" value="spam" />
                                                            <button
                                                                type="submit"
                                                                className="text-[#b32d2e] hover:text-[#8a2424] font-medium underline cursor-pointer"
                                                            >
                                                                {dict["admin.comments.table.spam"] || ""}
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Trash Toggle */}
                                                    {comment.commentApproved !== "trash" && (
                                                        <form action={updateCommentStatusAction}>
                                                            <input
                                                                type="hidden"
                                                                name="commentId"
                                                                value={idStr}
                                                            />
                                                            <input type="hidden" name="status" value="trash" />
                                                            <button
                                                                type="submit"
                                                                className="text-[#646970] hover:text-[#1d2327] font-medium underline cursor-pointer"
                                                            >
                                                                {dict["admin.comments.table.trash"] || ""}
                                                            </button>
                                                        </form>
                                                    )}

                                                    {/* Permanent Delete */}
                                                    <form action={deleteCommentAction}>
                                                        <input
                                                            type="hidden"
                                                            name="commentId"
                                                            value={idStr}
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="text-[#b32d2e] hover:text-[#8a2424] font-medium underline cursor-pointer"
                                                        >
                                                            {dict["admin.comments.table.delete"] || ""}
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot className="bg-[#f6f7f7] border-t border-[#c3c4c7]">
                        <tr>
                            <th className="w-8 px-2 py-2 text-center">
                                <input
                                    aria-label={dict["admin.common.select_all"] || ""}
                                    checked={allSelected}
                                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    type="checkbox"
                                />
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.author"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.comment"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.response_to"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.status"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.submitted"] || ""}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.actions"] || ""}
                            </th>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Bottom Tablenav (Bulk Actions, Pagination) */}
            <CommentTablenav
                basePath="/admincp/comments"
                bulkAction={bulkAction}
                currentCommentType={currentCommentType}
                currentLanguage={currentLanguage}
                currentPage={currentPage}
                currentStatus={currentStatus}
                dict={dict}
                isPending={isPending}
                languages={languages}
                onApplyBulkAction={handleApplyBulkAction}
                onBulkActionChange={setBulkAction}
                position="bottom"
                queryString={queryString}
                totalItems={totalItems}
                totalPages={totalPages}
            />
        </div>
    );
}
