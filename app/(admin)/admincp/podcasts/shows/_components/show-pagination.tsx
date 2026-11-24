import Link from "next/link"

export function ShowPagination({
  page,
  total,
  search,
  language,
  dict,
  basePath = "/admincp/podcasts/shows",
  status = "all",
}: {
  page: number
  total: number
  search: string
  language: string
  dict: Record<string, string>
  basePath?: string
  status?: string
}) {
  const pages = Math.max(1, Math.ceil(total / 20))
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const href = (target: number) => {
    const query = new URLSearchParams({ page: String(target), s: search, lang: language })
    if (status !== "all") query.set("status", status)
    return `${basePath}?${query}`
  }
  return (
    <div className="my-3 flex flex-wrap items-center justify-end gap-2 text-[13px]">
      <span>
        {total} {dict["admin.pagination.items"]}
      </span>
      <span>
        {page} {dict["admin.pagination.of"]} {pages}
      </span>
      {[
        { target: 1, label: "first", icon: "«", disabled: page === 1 },
        {
          target: page - 1,
          label: "previous",
          icon: "‹",
          disabled: page === 1,
        },
        { target: page + 1, label: "next", icon: "›", disabled: page >= pages },
        { target: pages, label: "last", icon: "»", disabled: page >= pages },
      ].map((item) =>
        item.disabled ? (
          <span
            key={item.label}
            aria-disabled="true"
            className="inline-flex size-[26px] items-center justify-center border border-[#dcdcde] text-[#a7aaad]"
            aria-label={t(item.label)}
          >
            {item.icon}
          </span>
        ) : (
          <Link
            key={item.label}
            aria-label={t(item.label)}
            href={href(item.target)}
            className="inline-flex size-[26px] items-center justify-center rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1]"
          >
            {item.icon}
          </Link>
        )
      )}
    </div>
  )
}
