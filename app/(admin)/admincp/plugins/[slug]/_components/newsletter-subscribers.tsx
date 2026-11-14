"use client"
import { newsletterCsvCell } from "@/lib/newsletter/csv"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getSubscriberPage } from "../../newsletter-query"
import { deleteSubscriberAction } from "../actions"
export function NewsletterSubscribers({
  dict,
  languages = [],
}: {
  dict: Record<string, string>
  languages?: { code: string; name: string }[]
}) {
  const [page, setPage] = useState(1),
    [locale, setLocale] = useState(""),
    client = useQueryClient()
  const query = useQuery({
    queryKey: ["newsletter-subscribers", page, locale],
    queryFn: () => getSubscriberPage(page, locale),
  })
  const remove = useMutation({
    mutationFn: deleteSubscriberAction,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["newsletter-subscribers"] }),
  })
  const data = query.data,
    pages = Math.max(1, Math.ceil((data?.total || 0) / 20))
  return (
    <section className="space-y-3 border border-[#c3c4c7] bg-white p-5">
      <h2 className="font-semibold">
        {dict["admin.plugins.newsletter.subscribers_title"]}
      </h2>
      {(data?.error || query.isError) && (
        <p role="alert">{dict[data?.error || "admin.plugins.save_failed"]}</p>
      )}
      {(remove.isError || remove.data?.success === false) && (
        <p role="alert">{dict["admin.plugins.save_failed"]}</p>
      )}
      <label>
        {dict["admin.plugins.subscribers.language"]}
        <select
          className="mx-2 h-[30px] border border-[#8c8f94]"
          value={locale}
          onChange={(e) => {
            setLocale(e.target.value)
            setPage(1)
          }}
        >
          <option value="">{dict["admin.plugins.all_languages"]}</option>
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="border border-[#2271b1] px-2 text-[#2271b1]"
        disabled={!data?.items.length}
        onClick={() => {
          const rows = [
            [
              dict["admin.plugins.subscribers.email"],
              dict["admin.plugins.subscribers.status"],
              dict["admin.plugins.subscribers.language"],
              dict["admin.plugins.subscribers.date"],
            ],
            ...(data?.items || []).map((row) => [
              row.email,
              row.status,
              row.locale || "",
              row.subscribedAt,
            ]),
          ]
          const url = URL.createObjectURL(
              new Blob(
                [
                  "\uFEFF" +
                    rows
                      .map((row) => row.map(newsletterCsvCell).join(","))
                      .join("\r\n"),
                ],
                { type: "text/csv;charset=utf-8" }
              )
            ),
            link = document.createElement("a")
          link.href = url
          link.download = `newsletter-page-${page}.csv`
          document.body.append(link)
          link.click()
          link.remove()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }}
      >
        {dict["admin.plugins.export_page"]}
      </button>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="size-[26px] border border-[#8c8f94]"
        >
          ‹
        </button>
        <span>
          {page} / {pages} ({data?.total || 0})
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
          className="size-[26px] border border-[#8c8f94]"
        >
          ›
        </button>
      </div>
      <table className="w-full border border-[#c3c4c7] text-start">
        <thead className="bg-[#f6f7f7]">
          <tr>
            {["email", "status", "language", "date", "action"].map((key) => (
              <th key={key} className="p-2 text-start">
                {dict[`admin.plugins.subscribers.${key}`]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.items.map((row) => (
            <tr key={row.id} className="border-t border-[#c3c4c7]">
              <td className="p-2">{row.email}</td>
              <td>{dict[`admin.plugins.subscribers.${row.status}`]}</td>
              <td>{row.locale}</td>
              <td>{new Date(row.subscribedAt).toLocaleDateString()}</td>
              <td>
                <button
                  disabled={remove.isPending}
                  className="text-[#b32d2e]"
                  onClick={() => {
                    if (
                      window.confirm(
                        dict["admin.plugins.subscribers.confirm_delete"]
                      )
                    )
                      remove.mutate(row.email)
                  }}
                >
                  {dict["admin.plugins.subscribers.delete"]}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
