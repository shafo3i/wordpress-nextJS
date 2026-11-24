"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SelectPodcastShow } from "@/db/schema/cms-podcasts"
import { deleteShowAction } from "../action"
import { ShowPagination } from "./show-pagination"

export function ShowTable({
  items,
  total,
  page,
  search,
  language,
  dict,
}: {
  items: SelectPodcastShow[]
  total: number
  page: number
  search: string
  language: string
  dict: Record<string, string>
}) {
  const [deleting, setDeleting] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const pagination = { total, page, search, language, dict }
  return (
    <div>
      {error && (
        <p role="alert" className="border-s-4 border-[#d63638] bg-white p-3">
          {error}
        </p>
      )}
      <ShowPagination {...pagination} />
      <div className="overflow-x-auto">
        <table className="w-full border border-[#c3c4c7] bg-white text-start text-[13px]">
          <thead className="bg-[#f6f7f7]">
            <tr>
              {["name", "slug", "language", "status"].map((key) => (
                <th key={key} className="p-3 text-start font-normal">
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((show, index) => (
              <tr key={show.id} className={index % 2 ? "" : "bg-[#f6f7f7]"}>
                <td className="p-3 align-top">
                  <Link
                    href={`/admincp/podcasts/shows?edit=${show.id}`}
                    className="font-semibold text-[#2271b1]"
                  >
                    {show.name}
                  </Link>
                  <div className="mt-1 flex gap-2">
                    <Link
                      href={`/admincp/podcasts/shows?edit=${show.id}`}
                      className="text-[#2271b1]"
                    >
                      {t("edit")}
                    </Link>
                    <button
                      type="button"
                      disabled={Boolean(deleting)}
                      className="text-[#b32d2e] disabled:opacity-50"
                      onClick={async () => {
                        if (!window.confirm(t("confirm_delete"))) return
                        setDeleting(show.id)
                        setError("")
                        try {
                          const result = await deleteShowAction(show.id)
                          if (result.error)
                            setError(dict[result.error] || t("error.failed"))
                          else router.refresh()
                        } catch {
                          setError(t("error.failed"))
                        } finally {
                          setDeleting("")
                        }
                      }}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
                <td className="p-3 align-top">{show.slug}</td>
                <td className="p-3 align-top">{show.languageCode}</td>
                <td className="p-3 align-top">{t(show.status)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={4} className="p-3">
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ShowPagination {...pagination} />
    </div>
  )
}
