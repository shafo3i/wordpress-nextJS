import Link from "next/link";
import { SelectLanguage } from "@/db/schema/cms-languages";

type Props = {
    languages: SelectLanguage[];
    activeLocale: string;
    currentGroup: string;
    currentFilter: string;
    searchQuery: string;
    stats: {
        total: number;
        translated: number;
        overridden: number;
        missing: number;
    };
    groups: string[];
    dict?: Record<string, string>;
};

export function TranslationFilter({
    languages,
    activeLocale,
    currentGroup,
    currentFilter,
    searchQuery,
    stats,
    groups,
    dict = {},
}: Props) {
    const buildHref = (paramsUpdate: Record<string, string | null>) => {
        const params = new URLSearchParams();
        params.set("locale", activeLocale);
        if (currentGroup && currentGroup !== "all") params.set("group", currentGroup);
        if (currentFilter && currentFilter !== "all") params.set("filter", currentFilter);
        if (searchQuery) params.set("s", searchQuery);

        for (const [key, value] of Object.entries(paramsUpdate)) {
            if (value === null || value === "all" || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }

        const str = params.toString();
        return `/admincp/translations${str ? `?${str}` : ""}`;
    };

    const filterTabs = [
        { key: "all", label: dict["admin.translations.filter.all"] || "All", count: stats.total },
        { key: "missing", label: dict["admin.translations.filter.missing"] || "Untranslated", count: stats.missing },
        { key: "overridden", label: dict["admin.translations.filter.overridden"] || "Custom Overrides", count: stats.overridden },
    ];

    return (
        <div className="space-y-3">
            {/* Language Selection Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#c3c4c7] pb-3">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                    {dict["admin.menu.languages"] || "Language"}:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                    {languages.map((lang) => {
                        const isSelected = lang.code === activeLocale;
                        return (
                            <Link
                                className={`rounded-[3px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                                    isSelected
                                        ? "bg-[#2271b1] text-white"
                                        : "border border-[#c3c4c7] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1]"
                                }`}
                                href={buildHref({ locale: lang.code, page: "1" })}
                                key={lang.code}
                            >
                                {lang.name} ({lang.code.toUpperCase()})
                                {lang.nativeName ? ` — ${lang.nativeName}` : ""}
                                {lang.isDefault ? ` [${dict["admin.languages.table.default"] || "Default"}]` : ""}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Filter Row: Status Tabs + Group Select + Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Status Tabs */}
                <ul className="flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
                    {filterTabs.map((tab, idx) => {
                        const isActive = currentFilter === tab.key;
                        return (
                            <li className="flex items-center" key={tab.key}>
                                {idx > 0 && <span className="mx-1.5 text-[#c3c4c7]">|</span>}
                                {isActive ? (
                                    <span className="font-semibold text-[#1d2327]">
                                        {tab.label} <span className="font-normal text-[#646970]">({tab.count})</span>
                                    </span>
                                ) : (
                                    <Link
                                        className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                                        href={buildHref({ filter: tab.key, page: "1" })}
                                    >
                                        {tab.label} <span className="font-normal text-[#646970]">({tab.count})</span>
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>

                {/* Group Selector & Search */}
                <form className="flex flex-wrap items-center gap-2 text-[13px]" method="get">
                    <input name="locale" type="hidden" value={activeLocale} />
                    {currentFilter !== "all" && (
                        <input name="filter" type="hidden" value={currentFilter} />
                    )}

                    {/* Group select */}
                    <select
                        className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        defaultValue={currentGroup}
                        name="group"
                    >
                        <option value="all">{dict["admin.translations.all_groups"] || "All Groups"}</option>
                        {groups.map((g) => (
                            <option key={g} value={g}>
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                            </option>
                        ))}
                    </select>

                    <input
                        className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        defaultValue={searchQuery}
                        name="s"
                        placeholder={dict["admin.translations.search_placeholder"] || "Search strings..."}
                        type="search"
                    />

                    <button
                        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
                        type="submit"
                    >
                        {dict["admin.translations.search_button"] || "Filter"}
                    </button>
                </form>
            </div>
        </div>
    );
}
