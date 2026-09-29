"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function TagFilter({
  searchQuery = "",
  dict = {},
}: {
  searchQuery?: string;
  dict?: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("s", search.trim());
    } else {
      params.delete("s");
    }
    params.set("page", "1");
    router.push(`/admincp/tags?${params.toString()}`);
  };

  return (
    <div className="mb-4 flex justify-end">
      <form className="flex items-center gap-1 text-[13px]" onSubmit={handleSearch}>
        <input
          aria-label={dict["admin.tags.search_placeholder"] || "Search Tags"}
          className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          name="s"
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict["admin.tags.search_placeholder"] || "Search Tags"}
          type="search"
          value={search}
        />
        <button
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
          type="submit"
        >
          {dict["admin.tags.search_button"] || "Search Tags"}
        </button>
      </form>
    </div>
  );
}
