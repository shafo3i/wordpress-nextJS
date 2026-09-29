import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import {
    getAllLanguagesQuery,
    getLanguageByCodeQuery,
    getLanguageCounts,
} from "./query";
import {
    LanguageTable,
    LanguageForm,
    LanguageFilter,
} from "./_components";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{
        s?: string;
        status?: string;
        page?: string;
        edit?: string;
        add?: string;
    }>;
};

export default async function LanguagesPage({ searchParams }: PageProps) {
    await verifyAdminOrEditor();

    const { s, status, page, edit, add } = await searchParams;
    const currentStatus = status ?? "all";
    const searchQuery = s?.trim() ?? "";
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const pageSize = 20;

    const isAdding = add === "true" || add === "1";
    const editCode = edit?.trim();

    const [{ languages, total }, counts, editingLanguage, langContext] = await Promise.all([
        getAllLanguagesQuery({
            status: currentStatus,
            search: searchQuery,
            page: currentPage,
            limit: pageSize,
        }),
        getLanguageCounts(),
        editCode ? getLanguageByCodeQuery(editCode) : Promise.resolve(null),
        getAdminLanguageContext(),
    ]);

    const dict = langContext.dict;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <AdminShell>
            <div className="space-y-4">
                <PostListHeader
                    addNewHref="/admincp/languages?add=true"
                    addNewLabel={dict["admin.languages.add_new"] || "Add Language"}
                    dict={dict}
                    title={dict["admin.languages.title"] || "Languages"}
                />

                {/* Create or Edit Form */}
                {(isAdding || editingLanguage) && (
                    <LanguageForm defaultValues={editingLanguage} dict={dict} />
                )}

                {/* Filter and Search Bar */}
                <LanguageFilter
                    counts={counts}
                    currentStatus={currentStatus}
                    dict={dict}
                    searchQuery={searchQuery}
                />

                {/* Widefat Table with Integrated Top & Bottom Pagination */}
                <LanguageTable
                    currentPage={currentPage}
                    currentStatus={currentStatus}
                    dict={dict}
                    pageSize={pageSize}
                    rows={languages}
                    searchQuery={searchQuery}
                    totalItems={total}
                    totalPages={totalPages}
                />
            </div>
        </AdminShell>
    );
}
