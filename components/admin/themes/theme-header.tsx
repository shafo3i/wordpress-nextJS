"use client";

export function ThemeHeader({
  search = "",
}: {
  search?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-[23px] font-normal leading-[1.3] text-[#1d2327]">Themes</h1>
        <button
          type="button"
          onClick={() => alert("Theme repository connection is active. Additional custom themes can be dropped into the themes/ folder.")}
          className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-1 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
        >
          Add New Theme
        </button>
      </div>

      <form method="GET" className="flex items-center gap-1">
        <label htmlFor="theme-search-input" className="sr-only">
          Search installed themes:
        </label>
        <input
          id="theme-search-input"
          name="s"
          defaultValue={search}
          placeholder="Search installed themes..."
          type="search"
          className="h-[30px] w-60 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
        />
        <button
          type="submit"
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}
