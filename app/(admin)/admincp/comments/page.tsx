import { commentQuerySchema, commentIdSchema } from "@/db/schema/cms-comments";
import { notFound } from "next/navigation";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdmin } from "@/lib/authMIddleware";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import {
    getAllComments,
    getCommentById,
    getCommentCounts,
    getPostOptionsForComments,
} from "./query";
import { getAllLanguages } from "@/services/language.service";
import {
    CommentTable,
    CommentForm,
    CommentFilter,
} from "./_components";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{
        s?: string;
        status?: string;
        page?: string;
        edit?: string;
        add?: string;
        comment_type?: string;
        lang?: string;
    }>;
};

export default async function CommentsPage({ searchParams }: PageProps) {
    await verifyAdmin();

    const { s, status, page, edit, add, comment_type, lang } = await searchParams;
    const currentStatus = commentQuerySchema.shape.status.safeParse(status).data ?? "all";
    const currentCommentType = commentQuerySchema.shape.commentType.safeParse(comment_type).data ?? "all";
    const currentLanguage = typeof lang === "string" && lang.length <= 10 ? lang : "all";
    const searchQuery = typeof s === "string" ? s.trim().slice(0, 200) : "";
    const currentPage = commentQuerySchema.shape.page.safeParse(Number(page)).data ?? 1;
    const pageSize = 20;

    const isAdding = add === "true" || add === "1";
    const editId = typeof edit === "string" ? edit.trim() : undefined;
    if (editId && !commentIdSchema.safeParse(editId).success) notFound();

    // Fetch comments list, count summary, language context, and editing context
    const [{ comments, total }, counts, editingComment, postOptions, langContext, allLanguages] = await Promise.all([
        getAllComments({
            status: currentStatus,
            commentType: currentCommentType,
            language: currentLanguage,
            search: searchQuery,
            page: currentPage,
            limit: pageSize,
        }),
        getCommentCounts(),
        editId ? getCommentById(editId) : Promise.resolve(null),
        isAdding || editId ? getPostOptionsForComments() : Promise.resolve([]),
        getAdminLanguageContext(),
        getAllLanguages(),
    ]);

    if (editId && !editingComment) notFound();
    if (editingComment?.commentPostId && !postOptions.some(post => post.id === editingComment.commentPostId)) {
        postOptions.push({ id: editingComment.commentPostId, title: editingComment.postTitle || "" });
    }
    const dict = langContext.dict;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const languageOptions = allLanguages.map((l) => ({
        code: l.code,
        name: l.name,
        nativeName: l.nativeName,
    }));

    return (
        <AdminShell>
            <div className="space-y-4">
                <PostListHeader
                    addNewHref="/admincp/comments?add=true"
                    addNewLabel={dict["admin.comments.add_new"] || ""}
                    dict={dict}
                    title={dict["admin.comments.title"] || ""}
                />

                {/* Create or Edit Form Modal / Block */}
                {(isAdding || editingComment) && (
                    <div className="rounded-lg border bg-card p-4 shadow-sm mb-6">
                        <CommentForm
                            defaultValues={editingComment ?? undefined}
                            postOptions={postOptions}
                        />
                    </div>
                )}

                {/* Filter and Search Bar */}
                <CommentFilter
                    counts={counts}
                    currentCommentType={currentCommentType}
                    currentLanguage={currentLanguage}
                    currentStatus={currentStatus}
                    dict={dict}
                    searchQuery={searchQuery}
                />

                {/* Comments Table with Integrated Top & Bottom Tablenav */}
                <CommentTable
                    currentCommentType={currentCommentType}
                    currentLanguage={currentLanguage}
                    currentPage={currentPage}
                    currentStatus={currentStatus}
                    dict={dict}
                    languages={languageOptions}
                    pageSize={pageSize}
                    rows={comments}
                    searchQuery={searchQuery}
                    totalItems={total}
                    totalPages={totalPages}
                />
            </div>
        </AdminShell>
    );
}
