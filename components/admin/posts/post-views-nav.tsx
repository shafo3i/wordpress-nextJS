"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export type StatusCounts = {
  all: number;
  publish: number;
  draft: number;
  pending?: number;
  private?: number;
  trash: number;
};

export function PostViewsNav({
  counts,
  currentStatus,
  currentLanguage = "all",
  languages = [],
  basePath = "/admincp/posts",
  dict = {},
  direction = "ltr",
}: {
  counts: StatusCounts;
  currentStatus?: string;
  currentLanguage?: string;
  languages?: { code: string; name: string; nativeName?: string }[];
  basePath?: string;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildStatusUrl = (status?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    return `${basePath}?${params.toString()}`;
  };

  const handleLanguageChange = (code: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (code && code !== "all") {
      params.set("lang", code);
    } else {
      params.delete("lang");
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const search = searchParams.get("s") || "";
  const category = searchParams.get("category");
  const date = searchParams.get("date");

  const items = [
    { key: undefined, label: dict["admin.common.all"] || "All", count: counts.all },
    { key: "publish", label: dict["admin.common.published"] || "Published", count: counts.publish },
    { key: "draft", label: dict["admin.common.draft"] || "Draft", count: counts.draft },
    ...(counts.pending !== undefined ? [{ key: "pending", label: dict["admin.common.pending"] || "Pending", count: counts.pending }] : []),
    ...(counts.private !== undefined ? [{ key: "private", label: dict["admin.common.private"] || "Private", count: counts.private }] : []),
    { key: "trash", label: dict["admin.common.trash"] || "Trash", count: counts.trash },
  ];

  return (
    <div
      className="mb-3 flex flex-wrap items-center justify-between gap-3 text-start"
      dir={direction}
    >
      {/* Status Views list */}
      <ul className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#646970]">
        {items.map((item, idx) => {
          const isActive = (item.key === undefined && !currentStatus) || currentStatus === item.key;
          return (
            <li className="inline-flex items-center" key={item.label}>
              {idx > 0 && <span className="ms-1.5 me-1.5 text-[#c3c4c7]">|</span>}
              <Link
                className={
                  isActive
                    ? "font-semibold text-[#1d2327]"
                    : "text-[#2271b1] hover:text-[#135e96] hover:underline"
                }
                href={buildStatusUrl(item.key)}
              >
                {item.label}{" "}
                <span className="font-normal text-[#646970]">({item.count})</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Filters: Language and Search */}
      <div className="flex flex-wrap items-center gap-2">
        {languages.length > 1 && (
          <div className="flex items-center gap-1.5 text-[13px]">
            <label htmlFor="posts-lang-filter" className="text-[#50575e]">
              {dict["admin.common.filter_by_language"] || "Language"}:
            </label>
            <select
              id="posts-lang-filter"
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[12px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none cursor-pointer"
            >
              <option value="all">
                {dict["admin.common.all_languages"] || "All Languages"}
              </option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName ? `${l.nativeName} (${l.name})` : l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <form className="flex items-center gap-1 text-[13px]" method="get">
          {currentStatus && <input name="status" type="hidden" value={currentStatus} />}
          {category && <input name="category" type="hidden" value={category} />}
          {date && <input name="date" type="hidden" value={date} />}
          {currentLanguage !== "all" && <input name="lang" type="hidden" value={currentLanguage} />}
          <input
            className="h-[30px] w-48 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] outline-none placeholder:text-[#a7aaad] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            defaultValue={search}
            name="s"
            placeholder={dict["admin.posts.search_placeholder"] || "Search Posts"}
            type="search"
          />
          <button
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            type="submit"
          >
            {dict["admin.posts.search_button"] || "Search Posts"}
          </button>
        </form>
      </div>
    </div>
  );
}
