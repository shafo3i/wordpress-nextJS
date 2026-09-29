"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CommentWithPost } from "../query";
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
                    await bulkUpdateCommentStatus(selectedIds, "1");
                    setNotice({
                        type: "success",
                        message: `${selectedIds.length} ${
                            dict["admin.comments.bulk.approved_notice"] || "comments approved."
                        }`,
                    });
                } else if (bulkAction === "unapprove") {
                    await bulkUpdateCommentStatus(selectedIds, "0");
                    setNotice({
                        type: "success",
                        message: `${selectedIds.length} ${
                            dict["admin.comments.bulk.unapproved_notice"] || "comments unapproved."
                        }`,
                    });
                } else if (bulkAction === "spam") {
                    await bulkUpdateCommentStatus(selectedIds, "spam");
                    setNotice({
                        type: "success",
                        message: `${selectedIds.length} ${
                            dict["admin.comments.bulk.spam_notice"] || "comments marked as spam."
                        }`,
                    });
                } else if (bulkAction === "trash") {
                    await bulkUpdateCommentStatus(selectedIds, "trash");
                    setNotice({
                        type: "success",
                        message: `${selectedIds.length} ${
                            dict["admin.comments.bulk.trash_notice"] || "comments moved to the Trash."
                        }`,
                    });
                } else if (bulkAction === "restore") {
                    await bulkUpdateCommentStatus(selectedIds, "0");
                    setNotice({
                        type: "success",
                        message: `${selectedIds.length} ${
                            dict["admin.comments.bulk.restored_notice"] || "comments restored."
                        }`,
                    });
                } else if (bulkAction === "delete") {
                    await bulkDeleteComments(selectedIds);
                    setNotice({
                        type: "success",
                        message: `${selectedIds.length} ${
                            dict["admin.comments.bulk.deleted_notice"] || "comments permanently deleted."
                        }`,
                    });
                }
                setSelectedIds([]);
                setBulkAction("Bulk actions");
                router.refresh();
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to execute bulk action.";
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
                        aria-label="Dismiss notice"
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
                                    aria-label={dict["admin.common.select_all"] || "Select All"}
                                    checked={allSelected}
                                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    type="checkbox"
                                />
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.author"] || "Author"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.comment"] || "Comment"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.response_to"] || "In Response To"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.status"] || "Status"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.submitted"] || "Submitted On"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.actions"] || "Actions"}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-[#646970]">
                                    {dict["admin.comments.table.no_comments"] || "No comments found."}
                                </td>
                            </tr>
                        ) : (
                            rows.map((comment) => {
                                const idStr = comment.commentId.toString();
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
                                                aria-label={`Select comment ${idStr}`}
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
                                                {comment.commentAuthor || "(Anonymous)"}
                                            </div>
                                            {comment.commentAuthorEmail && (
                                                <div className="text-xs text-[#2271b1] truncate max-w-[180px]">
                                                    <a
                                                        href={`mailto:${comment.commentAuthorEmail}`}
                                                        className="hover:underline"
                                                    >
                                                        {comment.commentAuthorEmail}
                                                    </a>
                                                </div>
                                            )}
                                            {comment.commentAuthorUrl && (
                                                <div className="text-xs text-[#2271b1] truncate max-w-[180px]">
                                                    <a
                                                        href={comment.commentAuthorUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
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
                                                        href={`/admincp/posts/${comment.commentPostId}`}
                                                        className="text-[13px] font-medium text-[#2271b1] hover:text-[#0a4b78] hover:underline max-w-[200px] truncate"
                                                        title={comment.postTitle || ""}
                                                    >
                                                        {comment.postTitle || "View Post"}
                                                    </Link>
                                                    {comment.postSlug && (
                                                        <Link
                                                            href={`/posts/${comment.postSlug}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[11px] text-[#646970] hover:text-[#2271b1] hover:underline"
                                                        >
                                                            {dict["admin.posts.view"] || "View Post"} ↗
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
                                                        {dict["admin.comments.table.edit"] || "Edit"}
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
                                                                {dict["admin.comments.table.approve"] || "Approve"}
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
                                                                {dict["admin.comments.table.unapprove"] || "Unapprove"}
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
                                                                {dict["admin.comments.table.spam"] || "Spam"}
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
                                                                {dict["admin.comments.table.trash"] || "Trash"}
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
                                                            {dict["admin.comments.table.delete"] || "Delete"}
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
                                    aria-label={dict["admin.common.select_all"] || "Select All"}
                                    checked={allSelected}
                                    className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    type="checkbox"
                                />
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.author"] || "Author"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.comment"] || "Comment"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.response_to"] || "In Response To"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.status"] || "Status"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.submitted"] || "Submitted On"}
                            </th>
                            <th className="px-3 py-2 text-start font-medium text-[#2c3338]">
                                {dict["admin.comments.table.actions"] || "Actions"}
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
