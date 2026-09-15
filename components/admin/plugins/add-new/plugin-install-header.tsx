import Link from "next/link";

export function PluginInstallHeader({
  search = "",
  activeCategory = "Featured",
}: {
  search?: string;
  activeCategory?: string;
}) {
  const categories = ["Featured", "Popular", "Recommended"];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">Add Plugins</h1>
          <Link
            href="/admincp/plugins"
            className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-1 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
          >
            ← Back to Installed Plugins
          </Link>
        </div>

        <form method="GET" className="flex items-center gap-1">
          <input type="hidden" name="tab" value="add-new" />
          <input
            name="s"
            defaultValue={search}
            placeholder="Search plugins..."
            type="search"
            className="h-[30px] w-64 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
          />
          <button
            type="submit"
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex items-center gap-1 border-b border-[#c3c4c7] pb-2 text-[13px]">
        {categories.map((cat, idx) => {
          const isCurrent = activeCategory === cat || (!activeCategory && cat === "Featured");
          return (
            <span key={cat} className="flex items-center">
              {idx > 0 && <span className="mx-2 text-[#a7aaad]">|</span>}
              <Link
                href={`/admincp/plugins?tab=add-new&category=${cat}${search ? `&s=${search}` : ""}`}
                className={`${
                  isCurrent
                    ? "font-semibold text-[#1d2327]"
                    : "text-[#2271b1] hover:text-[#135e96]"
                }`}
              >
                {cat}
              </Link>
            </span>
          );
        })}
      </div>
    </div>
  );
}
