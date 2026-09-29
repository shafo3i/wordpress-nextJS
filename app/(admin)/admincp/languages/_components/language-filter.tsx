import Link from "next/link";

type Props = {
    currentStatus: string;
    searchQuery: string;
    counts: {
        all: number;
        active: number;
        inactive: number;
    };
    dict?: Record<string, string>;
};

export function LanguageFilter({ currentStatus, searchQuery, counts, dict = {} }: Props) {
    const tabs = [
        { key: "all", label: dict["admin.languages.filter.all"] || "All", count: counts.all },
        { key: "active", label: dict["admin.languages.filter.active"] || "Active", count: counts.active },
        { key: "inactive", label: dict["admin.languages.filter.inactive"] || "Inactive", count: counts.inactive },
    ];

    const buildHref = (statusKey: string) => {
        const params = new URLSearchParams();
        if (statusKey !== "all") {
            params.set("status", statusKey);
        }
        if (searchQuery) {
            params.set("s", searchQuery);
        }
        const str = params.toString();
        return `/admincp/languages${str ? `?${str}` : ""}`;
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Views Navigation */}
            <ul className="flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
                {tabs.map((tab, idx) => {
                    const isActive = currentStatus === tab.key;
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
                                    href={buildHref(tab.key)}
                                >
                                    {tab.label} <span className="font-normal text-[#646970]">({tab.count})</span>
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* Top-Right Search Box */}
            <form className="flex items-center gap-1 text-[13px]" method="get">
                {currentStatus !== "all" && (
                    <input name="status" type="hidden" value={currentStatus} />
                )}
                <input
                    className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                    defaultValue={searchQuery}
                    name="s"
                    placeholder={dict["admin.languages.search_placeholder"] || "Search languages..."}
                    type="search"
                />
                <button
                    className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
                    type="submit"
                >
                    {dict["admin.languages.search_button"] || "Search"}
                </button>
            </form>
        </div>
    );
}
