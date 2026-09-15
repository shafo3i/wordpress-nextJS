import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PageTablenav({
  position = "top",
  bulkAction,
  onBulkActionChange,
  onApplyBulkAction,
  isPending = false,
  currentDate,
  totalItems = 0,
  currentPage = 1,
  totalPages = 1,
  basePath = "/admincp/pages",
  queryString = "",
}: {
  position?: "top" | "bottom";
  bulkAction: string;
  onBulkActionChange: (action: string) => void;
  onApplyBulkAction: () => void;
  isPending?: boolean;
  currentDate?: string;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
  queryString?: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(currentDate ?? "all");

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(pageNumber));
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  const handleFilter = () => {
    const params = new URLSearchParams(queryString);
    if (selectedDate && selectedDate !== "all") {
      params.set("date", selectedDate);
    } else {
      params.delete("date");
    }
    params.delete("page");
    const suffix = params.toString();
    router.push(`${basePath}${suffix ? `?${suffix}` : ""}`);
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#50575e] ${
        position === "top" ? "mb-2" : "mt-3"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label="Bulk actions"
          className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          onChange={(e) => onBulkActionChange(e.target.value)}
          value={bulkAction}
        >
          <option value="Bulk actions">Bulk actions</option>
          <option value="Move to Trash">Move to Trash</option>
          <option value="Restore">Restore</option>
          <option value="Delete permanently">Delete permanently</option>
        </select>
        <button
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50"
          disabled={isPending || bulkAction === "Bulk actions"}
          onClick={onApplyBulkAction}
          type="button"
        >
          {isPending ? "Applying..." : "Apply"}
        </button>

        {position === "top" && (
          <>
            <select
              aria-label="Filter by date"
              className="ml-2 h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              onChange={(e) => setSelectedDate(e.target.value)}
              value={selectedDate}
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="month">This month</option>
            </select>

            <button
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={handleFilter}
              type="button"
            >
              Filter
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#646970]">
          {totalItems} item{totalItems === 1 ? "" : "s"}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[13px] text-[#646970]">
              {currentPage} of {totalPages}
            </span>
            {currentPage > 1 ? (
              <Link
                aria-label="First page"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(1)}
              >
                «
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                «
              </span>
            )}
            {currentPage > 1 ? (
              <Link
                aria-label="Previous page"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(currentPage - 1)}
              >
                ‹
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                ‹
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                aria-label="Next page"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(currentPage + 1)}
              >
                ›
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                ›
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                aria-label="Last page"
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(totalPages)}
              >
                »
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad]">
                »
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
