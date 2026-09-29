import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
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
    await verifyAdminOrEditor();

    const { s, status, page, edit, add, comment_type, lang } = await searchParams;
    const currentStatus = status ?? "all";
    const currentCommentType = comment_type ?? "all";
    const currentLanguage = lang ?? "all";
    const searchQuery = s?.trim() ?? "";
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const pageSize = 20;

    const isAdding = add === "true" || add === "1";
    const editId = edit?.trim();

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
                    addNewLabel={dict["admin.comments.add_new"] || "Add Comment"}
                    dict={dict}
                    title={dict["admin.comments.title"] || "Comments"}
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
