import Link from "next/link";

type Counts = {
  all: number;
  active: number;
  inactive: number;
};

type Props = {
  currentStatus?: string;
  searchQuery?: string;
  counts: Counts;
  basePath?: string;
  dict?: Record<string, string>;
};

export function PluginFilter({
  currentStatus = "all",
  searchQuery = "",
  counts,
  basePath = "/admincp/plugins",
  dict = {},
}: Props) {
  const buildHref = (status?: string) => {
    const params = new URLSearchParams();
    if (status && status !== "all") {
      params.set("status", status);
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      params.set("s", searchQuery.trim());
    }
    params.delete("page");
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  const items = [
    { key: "all", label: dict["admin.plugins.filter.all"] || "All", count: counts.all },
    { key: "active", label: dict["admin.plugins.filter.active"] || "Active", count: counts.active },
    { key: "inactive", label: dict["admin.plugins.filter.inactive"] || "Inactive", count: counts.inactive },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      {/* Views Nav */}
      <ul className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
        {items.map((item, index) => {
          const isActive = currentStatus === item.key;
          return (
            <li className="flex items-center" key={item.key}>
              {index > 0 && <span className="mx-1.5 text-[#dcdcde]">|</span>}
              <Link
                className={`transition-colors ${
                  isActive
                    ? "font-semibold text-[#1d2327]"
                    : "text-[#2271b1] hover:text-[#135e96]"
                }`}
                href={buildHref(item.key)}
              >
                {item.label}{" "}
                <span className="text-[#646970]">({item.count})</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Search Box */}
      <form action={basePath} className="flex items-center gap-2" method="GET">
        {currentStatus && currentStatus !== "all" && (
          <input name="status" type="hidden" value={currentStatus} />
        )}
        <label className="sr-only" htmlFor="plugin-search-input">
          {dict["admin.plugins.search_placeholder"] || "Search Installed Plugins"}
        </label>
        <input
          className="h-8 rounded border border-[#8c8f94] bg-white px-2 py-1 text-xs text-[#2c3338] shadow-sm focus:border-[#2271b1] focus:outline-none"
          defaultValue={searchQuery}
          id="plugin-search-input"
          name="s"
          placeholder={dict["admin.plugins.search_placeholder"] || "Search Installed Plugins..."}
          type="search"
        />
        <button
          className="h-8 rounded border border-[#2271b1] bg-[#f6f7f7] px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f0f0f1] cursor-pointer"
          type="submit"
        >
          {dict["admin.plugins.search_button"] || "Search Installed Plugins"}
        </button>
      </form>
    </div>
  );
}
