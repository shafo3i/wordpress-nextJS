import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { PostListHeader } from "@/components/admin/posts/post-list-header";
import { getTranslationsPageData } from "./query";
import {
    TranslationTable,
    TranslationFilter,
    TranslationForm,
} from "./_components";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams: Promise<{
        locale?: string;
        group?: string;
        filter?: "all" | "missing" | "overridden";
        s?: string;
        page?: string;
        add?: string;
    }>;
};

export default async function TranslationsPage({ searchParams }: PageProps) {
    await verifyAdminOrEditor();
    const { dict } = await getAdminLanguageContext();

    const { locale, group, filter, s, page, add } = await searchParams;
    const currentGroup = group ?? "all";
    const currentFilter = filter ?? "all";
    const searchQuery = s?.trim() ?? "";
    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const pageSize = 20;

    const data = await getTranslationsPageData({
        locale,
        group: currentGroup,
        filter: currentFilter,
        search: searchQuery,
        page: currentPage,
        limit: pageSize,
    });

    const isAdding = add === "true" || add === "1";
    const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

    // Construct current URL for redirects
    const currentParams = new URLSearchParams();
    if (data.activeLocale) currentParams.set("locale", data.activeLocale);
    if (currentGroup !== "all") currentParams.set("group", currentGroup);
    if (currentFilter !== "all") currentParams.set("filter", currentFilter);
    if (searchQuery) currentParams.set("s", searchQuery);
    if (currentPage > 1) currentParams.set("page", String(currentPage));
    const returnUrl = `/admincp/translations?${currentParams.toString()}`;

    const addStringHref = `/admincp/translations?${(() => {
        const p = new URLSearchParams(currentParams);
        p.set("add", "true");
        return p.toString();
    })()}`;

    return (
        <AdminShell>
            <div className="space-y-4">
                <PostListHeader
                    addNewHref={addStringHref}
                    addNewLabel={dict?.["admin.translations.addString"] ?? "Add String"}
                    dict={dict}
                    title={`${dict?.["admin.translations.title"] ?? "Translations"}: ${data.currentLanguage?.name ?? data.activeLocale.toUpperCase()}`}
                />

                {/* Add New String Form */}
                {isAdding && (
                    <TranslationForm
                        activeLocale={data.activeLocale}
                        dict={dict}
                        returnUrl={returnUrl}
                    />
                )}

                {/* Filter, Language Switcher & Search Bar */}
                <TranslationFilter
                    activeLocale={data.activeLocale}
                    currentFilter={currentFilter}
                    currentGroup={currentGroup}
                    dict={dict}
                    groups={data.groups}
                    languages={data.languages}
                    searchQuery={searchQuery}
                    stats={data.stats}
                />

                {/* Widefat Table with Integrated Top & Bottom Pagination */}
                <TranslationTable
                    currentPage={currentPage}
                    dict={dict}
                    direction={data.currentLanguage?.direction ?? "ltr"}
                    filter={currentFilter}
                    group={currentGroup}
                    items={data.items}
                    locale={data.activeLocale}
                    pageSize={pageSize}
                    returnUrl={returnUrl}
                    searchQuery={searchQuery}
                    totalItems={data.total}
                    totalPages={totalPages}
                />
            </div>
        </AdminShell>
    );
}
