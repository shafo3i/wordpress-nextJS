import Link from "next/link";

export function PluginViewsNav({
  counts,
  currentStatus = "all",
  search,
}: {
  counts: { all: number; active: number; inactive: number };
  currentStatus?: string;
  search?: string;
}) {
  const buildHref = (status?: string) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (search) params.set("s", search);
    const qs = params.toString();
    return `/admincp/plugins${qs ? `?${qs}` : ""}`;
  };

  const links = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "inactive", label: "Inactive", count: counts.inactive },
  ];

  return (
    <ul className="flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
      {links.map((link, idx) => {
        const isCurrent = currentStatus === link.key || (!currentStatus && link.key === "all");
        return (
          <li key={link.key} className="flex items-center">
            {idx > 0 && <span className="mr-1 text-[#a7aaad]">|</span>}
            <Link
              href={buildHref(link.key)}
              className={`${
                isCurrent
                  ? "font-semibold text-[#1d2327]"
                  : "text-[#2271b1] hover:text-[#135e96]"
              }`}
            >
              {link.label}{" "}
              <span className="text-[#646970]">({link.count})</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
