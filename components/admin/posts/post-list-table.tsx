"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MessageSquare } from "lucide-react";
import {
  deletePosts,
  movePostsToTrash,
  restorePosts,
} from "@/app/(admin)/admincp/posts";
import { PostTablenav, type CategoryOption } from "./post-tablenav";
import { PostRowItem, type PostRowData } from "./post-row-item";
import { PostQuickEditRow } from "./post-quick-edit-row";

export function PostListTable({
  posts: initialPosts,
  categories = [],
  currentCategory,
  currentDate,
  basePath = "/admincp/posts",
  emptyMessage = "No posts found.",
  pagination,
  isTrashView = false,
  dict = {},
  direction = "ltr",
  onNotice,
}: {
  posts: PostRowData[];
  categories?: CategoryOption[];
  currentCategory?: string;
  currentDate?: string;
  basePath?: string;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    queryString?: string;
  };
  isTrashView?: boolean;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
  onNotice?: (notice: { type?: "success" | "warning" | "error"; message: string } | null) => void;
}) {
  const [posts, setPosts] = useState<PostRowData[]>(initialPosts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<{ type?: "success" | "warning" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // If initialPosts changed (e.g. server re-render on navigation), sync local state
  if (initialPosts !== posts && !quickEditId) {
    setPosts(initialPosts);
  }

  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? posts.map((p) => p.id) : []);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((curr) => (checked ? [...new Set([...curr, id])] : curr.filter((i) => i !== id)));
  };

  const emitNotice = (notice: { type?: "success" | "warning" | "error"; message: string } | null) => {
    setLocalNotice(notice);
    onNotice?.(notice);
  };

  const handleApplyBulkAction = () => {
    if (!selectedIds.length || bulkAction === "Bulk actions") return;

    startTransition(async () => {
      if (bulkAction === "Move to Trash") {
        await movePostsToTrash(selectedIds);
        emitNotice({
          type: "success",
          message: `${selectedIds.length} ${dict["admin.posts.bulk_trash_notice"] || "posts moved to the Trash."}`,
        });
      } else if (bulkAction === "Restore") {
        await restorePosts(selectedIds);
        emitNotice({
          type: "success",
          message: `${selectedIds.length} ${dict["admin.posts.bulk_restore_notice"] || "posts restored."}`,
        });
      } else if (bulkAction === "Delete permanently") {
        await deletePosts(selectedIds);
        emitNotice({
          type: "success",
          message: `${selectedIds.length} ${dict["admin.posts.bulk_delete_notice"] || "posts permanently deleted."}`,
        });
      }
      setSelectedIds([]);
      setBulkAction("Bulk actions");
      router.refresh();
    });
  };

  const handleRowTrash = (postId: string) => {
    startTransition(async () => {
      await movePostsToTrash([postId]);
      emitNotice({
        type: "success",
        message: dict["admin.posts.single_trash_notice"] || "1 post moved to the Trash.",
      });
      router.refresh();
    });
  };

  const handleRowRestore = (postId: string) => {
    startTransition(async () => {
      await restorePosts([postId]);
      emitNotice({
        type: "success",
        message: dict["admin.posts.single_restore_notice"] || "1 post restored.",
      });
      router.refresh();
    });
  };

  const handleRowDeletePermanently = (postId: string) => {
    startTransition(async () => {
      await deletePosts([postId]);
      emitNotice({
        type: "success",
        message: dict["admin.posts.single_delete_notice"] || "1 post permanently deleted.",
      });
      router.refresh();
    });
  };

  const handleQuickEditSuccess = (updated: {
    id: string;
    title: string;
    slug: string;
    status: string;
    date: string;
  }) => {
    setPosts((curr) =>
      curr.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
    setQuickEditId(null);
    emitNotice({
      type: "success",
      message: dict["admin.posts.updated_notice"] || "Post updated.",
    });
    router.refresh();
  };

  return (
    <div className="space-y-2 text-start" dir={direction}>
      {localNotice && (
        <div
          className={`flex items-center justify-between rounded-[3px] border-s-4 p-3 text-[13px] ${
            localNotice.type === "error"
              ? "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
              : localNotice.type === "warning"
                ? "border-[#dba617] bg-[#fcf9e8] text-[#1d2327]"
                : "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
          }`}
        >
          <span>{localNotice.message}</span>
          <button
            type="button"
            onClick={() => setLocalNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Tablenav */}
      <PostTablenav
        basePath={basePath}
        bulkAction={bulkAction}
        categories={categories}
        currentCategory={currentCategory}
        currentDate={currentDate}
        currentPage={pagination?.currentPage}
        dict={dict}
        direction={direction}
        isPending={isPending}
        isTrashView={isTrashView}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="top"
        queryString={pagination?.queryString}
        totalItems={pagination?.totalItems ?? posts.length}
        totalPages={pagination?.totalPages}
      />

      {/* WordPress Widefat Fixed Striped Posts Table */}
      <div className="overflow-x-auto rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <table className="w-full min-w-[800px] table-fixed border-collapse text-start text-[13px]">
          <colgroup>
            <col className="w-[38px]" />
            <col className="w-[34%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[50px]" />
            <col className="w-[16%]" />
          </colgroup>

          <thead className="border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#2c3338]">
            <tr>
              <th className="w-[38px] px-3 py-2 text-center">
                <input
                  aria-label={dict["admin.common.select_all"] || "Select all posts"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <span className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0073aa]">
                  <bdi>{dict["admin.posts.table.title"] || "Title"}</bdi>
                  <span className="text-[10px] text-[#a7aaad]" aria-hidden="true">▾</span>
                </span>
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.author"] || "Author"}</bdi>
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.categories"] || "Categories"}</bdi>
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.tags"] || "Tags"}</bdi>
              </th>
              <th className="w-[50px] px-3 py-2 text-center font-semibold">
                <MessageSquare className="inline size-3.5 fill-[#72777c] text-transparent" />
              </th>
              <th className="px-3 py-2 font-semibold text-start whitespace-nowrap">
                <span className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0073aa]">
                  <bdi>{dict["admin.posts.table.date"] || "Date"}</bdi>
                  <span className="text-[10px] text-[#a7aaad]" aria-hidden="true">▾</span>
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {posts.length ? (
              posts.map((post, idx) => (
                quickEditId === post.id ? (
                  <PostQuickEditRow
                    categories={categories}
                    dict={dict}
                    direction={direction}
                    key={`quick-edit-${post.id}`}
                    onCancel={() => setQuickEditId(null)}
                    onSuccess={handleQuickEditSuccess}
                    post={post}
                  />
                ) : (
                  <PostRowItem
                    basePath={basePath}
                    dict={dict}
                    direction={direction}
                    index={idx}
                    isSelected={selectedIds.includes(post.id)}
                    key={post.id}
                    onDeletePermanently={() => handleRowDeletePermanently(post.id)}
                    onQuickEdit={() => setQuickEditId(post.id)}
                    onRestore={() => handleRowRestore(post.id)}
                    onToggleSelect={(checked) => toggleSelectOne(post.id, checked)}
                    onTrash={() => handleRowTrash(post.id)}
                    post={post}
                  />
                )
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-[#646970]" colSpan={7}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="border-t border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#2c3338]">
            <tr>
              <th className="w-[38px] px-3 py-2 text-center">
                <input
                  aria-label={dict["admin.common.select_all"] || "Select all posts bottom"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.title"] || "Title"}</bdi>
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.author"] || "Author"}</bdi>
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.categories"] || "Categories"}</bdi>
              </th>
              <th className="px-3 py-2 font-semibold text-start">
                <bdi>{dict["admin.posts.table.tags"] || "Tags"}</bdi>
              </th>
              <th className="w-[50px] px-3 py-2 text-center font-semibold">
                <MessageSquare className="inline size-3.5 fill-[#72777c] text-transparent" />
              </th>
              <th className="px-3 py-2 font-semibold text-start whitespace-nowrap">
                <bdi>{dict["admin.posts.table.date"] || "Date"}</bdi>
              </th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <PostTablenav
        basePath={basePath}
        bulkAction={bulkAction}
        categories={categories}
        currentPage={pagination?.currentPage}
        dict={dict}
        direction={direction}
        isPending={isPending}
        isTrashView={isTrashView}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="bottom"
        queryString={pagination?.queryString}
        totalItems={pagination?.totalItems ?? posts.length}
        totalPages={pagination?.totalPages}
      />
    </div>
  );
}
