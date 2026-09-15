import Link from "next/link";

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
  basePath = "/admincp/posts",
  queryString = "",
}: {
  counts: StatusCounts;
  currentStatus?: string;
  basePath?: string;
  queryString?: string;
}) {
  const buildHref = (status?: string) => {
    const params = new URLSearchParams(queryString);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  const items = [
    { key: undefined, label: "All", count: counts.all },
    { key: "publish", label: "Published", count: counts.publish },
    { key: "draft", label: "Draft", count: counts.draft },
    ...(counts.pending !== undefined ? [{ key: "pending", label: "Pending", count: counts.pending }] : []),
    ...(counts.private !== undefined ? [{ key: "private", label: "Private", count: counts.private }] : []),
    { key: "trash", label: "Trash", count: counts.trash },
  ];

  return (
    <ul className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
      {items.map((item, idx) => {
        const isActive = (item.key === undefined && !currentStatus) || currentStatus === item.key;
        return (
          <li className="inline-flex items-center" key={item.label}>
            {idx > 0 && <span className="mr-1 text-[#c3c4c7]">|</span>}
            <Link
              className={
                isActive
                  ? "font-semibold text-[#1d2327]"
                  : "text-[#2271b1] hover:text-[#135e96] hover:underline"
              }
              href={buildHref(item.key)}
            >
              {item.label}{" "}
              <span className="font-normal text-[#646970]">({item.count})</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
