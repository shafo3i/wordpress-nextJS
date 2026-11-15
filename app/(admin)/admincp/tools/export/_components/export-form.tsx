"use client"

import { useState } from "react"
import {
  Download,
  Database,
  FileCode,
  Archive,
  CheckCircle2,
  Loader2,
} from "lucide-react"

interface ExportFormProps {
  categories: Array<{ termId: bigint; name: string; slug: string }>
  authors: Array<{ id: string; name: string; email: string }>
  stats: {
    posts: number
    pages: number
    comments: number
    categories: number
  }
  dict: Record<string, string>
}

export function ExportForm({
  categories,
  authors,
  stats,
  dict,
}: ExportFormProps) {
  const [format, setFormat] = useState<"xml" | "sql" | "json">("xml")
  const [contentType, setContentType] = useState<"all" | "post" | "page">("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAuthor, setSelectedAuthor] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const handleDownload = async () => {
    setError(null)
    setIsExporting(true)

    const params = new URLSearchParams()
    params.set("format", format)

    if (format !== "sql") {
      params.set("content", contentType)

      if (contentType === "post" && selectedCategory !== "all") {
        params.set("categoryId", selectedCategory)
      }
      if (selectedAuthor !== "all") {
        params.set("authorId", selectedAuthor)
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus)
      }
      if (startDate) {
        params.set("startDate", startDate)
      }
      if (endDate) {
        params.set("endDate", endDate)
      }
    }

    try {
      const response = await fetch(
        `/api/admin/tools/export?${params.toString()}`,
        { cache: "no-store" }
      )
      if (
        !response.ok ||
        response.redirected ||
        !response.headers.get("Content-Disposition")?.startsWith("attachment;")
      )
        throw new Error("export_failed")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob),
        link = document.createElement("a")
      link.href = url
      link.download = `pressforge-content.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6 rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div>
        <h2 className="text-[16px] font-semibold text-[#1d2327]">
          {dict["admin.tools.choose_what_to_export"] || ""}
        </h2>
        <p className="mt-1 text-[13px] text-[#50575e]">
          {dict["admin.tools.export_intro"] || ""}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-[#d63638]">
          {error}
        </p>
      )}
      <p className="text-[13px] text-[#50575e]">
        {dict["admin.tools.archive_scope"]}
      </p>
      {/* Format Selector */}
      <div className="space-y-3">
        <label className="block text-[13px] font-semibold text-[#1d2327]">
          {dict["admin.tools.export_format"] || ""}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setFormat("xml")}
            className={`flex cursor-pointer items-start gap-3 rounded-[3px] border p-3.5 text-start transition-all ${
              format === "xml"
                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
            }`}
          >
            <FileCode
              className={`mt-0.5 size-5 ${format === "xml" ? "text-[#2271b1]" : "text-[#646970]"}`}
            />
            <div>
              <span className="block text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.tools.format_wxr"] || ""}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#646970]">
                {dict["admin.tools.format_wxr_desc"] || ""}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat("sql")}
            className={`flex cursor-pointer items-start gap-3 rounded-[3px] border p-3.5 text-start transition-all ${
              format === "sql"
                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
            }`}
          >
            <Database
              className={`mt-0.5 size-5 ${format === "sql" ? "text-[#2271b1]" : "text-[#646970]"}`}
            />
            <div>
              <span className="block text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.tools.content_export.sql_title"] || ""}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#646970]">
                {dict["admin.tools.content_export.sql_description"] || ""}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat("json")}
            className={`flex cursor-pointer items-start gap-3 rounded-[3px] border p-3.5 text-start transition-all ${
              format === "json"
                ? "border-[#2271b1] bg-[#f0f6fc] ring-1 ring-[#2271b1]"
                : "border-[#dcdcde] bg-white hover:border-[#8c8f94]"
            }`}
          >
            <Archive
              className={`mt-0.5 size-5 ${format === "json" ? "text-[#2271b1]" : "text-[#646970]"}`}
            />
            <div>
              <span className="block text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.tools.format_json"] || ""}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#646970]">
                {dict["admin.tools.content_export.json_description"] || ""}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Filter Options (for XML & JSON) */}
      {format !== "sql" && (
        <div className="space-y-4 border-t border-[#f0f0f1] pt-4">
          <label className="block text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.tools.content_to_export"] || ""}
          </label>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1d2327]">
              <input
                type="radio"
                name="contentType"
                value="all"
                checked={contentType === "all"}
                onChange={() => setContentType("all")}
                className="text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="font-medium">
                {dict["admin.tools.all_content"] || ""}
              </span>
              <span className="text-[12px] text-[#646970]">
                ({dict["admin.tools.all_content_desc"] || ""})
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1d2327]">
              <input
                type="radio"
                name="contentType"
                value="post"
                checked={contentType === "post"}
                onChange={() => setContentType("post")}
                className="text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="font-medium">
                {dict["admin.posts.title"] || ""} ({stats.posts})
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1d2327]">
              <input
                type="radio"
                name="contentType"
                value="page"
                checked={contentType === "page"}
                onChange={() => setContentType("page")}
                className="text-[#2271b1] focus:ring-[#2271b1]"
              />
              <span className="font-medium">
                {dict["admin.menu.pages"] || ""} ({stats.pages})
              </span>
            </label>
          </div>

          {/* Granular Post Filters */}
          {contentType === "post" && (
            <div className="ml-6 space-y-3 rounded border border-[#dcdcde] bg-[#f6f7f7] p-4 text-[13px]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[#50575e]">
                    {dict["admin.posts.table.categories"] || ""}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">
                      {dict["admin.common.all"] || ""}
                    </option>
                    {categories.map((c) => (
                      <option key={String(c.termId)} value={String(c.termId)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[#50575e]">
                    {dict["admin.posts.table.author"] || ""}
                  </label>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">
                      {dict["admin.common.all"] || ""}
                    </option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || a.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[#50575e]">
                    {dict["admin.posts.table.status"] || ""}
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="all">
                      {dict["admin.common.all"] || ""}
                    </option>
                    <option value="publish">
                      {dict["admin.posts.status.publish"] || ""}
                    </option>
                    <option value="draft">
                      {dict["admin.posts.status.draft"] || ""}
                    </option>
                    <option value="pending">
                      {dict["admin.posts.status.pending"] || ""}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[#50575e]">
                    {dict["admin.tools.date_range"] || ""}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[12px] text-[#2c3338]"
                    />
                    <span className="text-[#646970]">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[12px] text-[#2c3338]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SQL Dump Information Notice */}
      {format === "sql" && (
        <div className="border-t border-[#f0f0f1] pt-4">
          <div className="flex items-start gap-2.5 rounded-[3px] border border-[#c5d9ed] bg-[#f0f6fc] p-3 text-[13px] text-[#1d2327]">
            <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-[#2271b1]" />
            <div>
              <span className="block font-semibold">
                {dict["admin.tools.content_export.sql_notice_title"] || ""}
              </span>
              <span className="mt-0.5 block text-[12px] text-[#50575e]">
                {dict["admin.tools.content_export.sql_notice_description"] || ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex items-center justify-between border-t border-[#f0f0f1] pt-5">
        <button
          type="button"
          disabled={isExporting}
          onClick={handleDownload}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#135e96] disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {dict["admin.tools.generating_export"] || ""}
            </>
          ) : (
            <>
              <Download className="size-4" />
              {dict["admin.tools.download_export_file"] || ""}
            </>
          )}
        </button>

        <span className="text-[12px] text-[#646970]">
          {format === "xml" && (dict["admin.tools.xml_tip"] || "")}
          {format === "sql" && (dict["admin.tools.sql_tip"] || "")}
          {format === "json" && (dict["admin.tools.json_tip"] || "")}
        </span>
      </div>
    </div>
  )
}
