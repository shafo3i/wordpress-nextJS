import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Props = {
    position?: "top" | "bottom";
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    locale?: string;
    group?: string;
    filter?: string;
    searchQuery?: string;
    basePath?: string;
    dict?: Record<string, string>;
};

export function TranslationPagination({
    position = "top",
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    locale = "en",
    group = "all",
    filter = "all",
    searchQuery = "",
    basePath = "/admincp/translations",
    dict = {},
}: Props) {
    const validTotalPages = Math.max(1, totalPages);
    const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

    const buildHref = (pageNumber: number) => {
        const params = new URLSearchParams();
        if (locale) params.set("locale", locale);
        if (group && group !== "all") params.set("group", group);
        if (filter && filter !== "all") params.set("filter", filter);
        if (searchQuery && searchQuery.trim().length > 0) {
            params.set("s", searchQuery.trim());
        }
        params.set("page", String(pageNumber));
        const suffix = params.toString();
        return `${basePath}${suffix ? `?${suffix}` : ""}`;
    };

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#50575e] ${
                position === "top" ? "mb-2" : "mt-3"
            }`}
        >
            <div className="flex items-center gap-1.5">
                {/* Left tablenav placeholder */}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[13px] text-[#646970]">
                    {totalItems} {dict["admin.pagination.items"] || "items"}
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
