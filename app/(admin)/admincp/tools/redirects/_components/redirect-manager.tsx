"use client"

import { safeMediaUrl } from "@/lib/post-media"
import { useState } from "react"
import {
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Search,
  Link as LinkIcon,
} from "lucide-react"
import type { RedirectItem } from "@/services/redirect.service"
import {
  createRedirectAction,
  deleteRedirectAction,
  fetchRedirectsAction,
} from "../actions"

interface RedirectManagerProps {
  initialRedirects: RedirectItem[]
  dict: Record<string, string>
}

export function RedirectManager({
  initialRedirects,
  dict,
}: RedirectManagerProps) {
  const [redirects, setRedirects] = useState<RedirectItem[]>(initialRedirects)
  const [searchTerm, setSearchTerm] = useState("")
  const [sourcePath, setSourcePath] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [statusCode, setStatusCode] = useState<"301" | "302">("301")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourcePath.trim() || !targetUrl.trim()) {
      setError(dict["admin.tools.redirect_required"] || "")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await createRedirectAction({
        sourcePath,
        targetUrl,
        statusCode: Number(statusCode) as 301 | 302,
        notes,
      })

      if (!res.success) {
        throw new Error(res.error || dict["admin.tools.error.failed"])
      }

      const fresh = await fetchRedirectsAction()
      if (fresh.success && fresh.redirects) {
        setRedirects(fresh.redirects)
      }
      setSourcePath("")
      setTargetUrl("")
      setNotes("")
      setSuccess(dict["admin.tools.redirect_created"] || "")
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(dict["admin.tools.confirm_delete_redirect"] || "")) {
      return
    }

    setError(null)
    setSuccess(null)
    try {
      const res = await deleteRedirectAction(id)
      if (!res.success) {
        setError(res.error || dict["admin.tools.error.failed"])
        return
      }
      setRedirects((previous) => previous.filter((item) => item.id !== id))
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    }
  }

  const filtered = redirects.filter(
    (r) =>
      r.sourcePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Create Redirect Box */}
      <form
        onSubmit={handleAddRedirect}
        className="space-y-4 rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
      >
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {dict["admin.tools.add_redirect_title"] || ""}
          </h2>
          <p className="mt-0.5 text-[13px] text-[#50575e]">
            {dict["admin.tools.add_redirect_desc"] || ""}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-[12px] font-semibold text-[#1d2327]">
              {dict["admin.tools.source_url"] || ""}
            </label>
            <input
              type="text"
              required
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder={dict["admin.tools.redirect.source_example"]}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 font-mono text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <label className="mb-1 block text-[12px] font-semibold text-[#1d2327]">
              {dict["admin.tools.target_url"] || ""}
            </label>
            <input
              type="text"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder={dict["admin.tools.redirect.target_example"]}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-1.5 font-mono text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[12px] font-semibold text-[#1d2327]">
              {dict["admin.tools.status_code"] || ""}
            </label>
            <select
              value={statusCode}
              onChange={(e) =>
                setStatusCode(e.target.value === "302" ? "302" : "301")
              }
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1.5 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            >
              <option value="301">
                {dict["admin.tools.redirect.permanent"]}
              </option>
              <option value="302">
                {dict["admin.tools.redirect.temporary"]}
              </option>
            </select>
          </div>

          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#135e96] disabled:opacity-50"
            >
              <Plus className="size-4" />
              {dict["admin.tools.add_redirect_btn"] || ""}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[3px] border border-[#d63638] bg-[#fcf0f1] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-[3px] border border-[#00a32a] bg-[#edfaef] p-3 text-[13px] text-[#00a32a]">
            <CheckCircle className="size-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </form>

      {/* Redirects Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="size-4 text-[#2271b1]" />
            <span className="text-[14px] font-semibold text-[#1d2327]">
              {dict["admin.tools.active_redirects"] || ""} ({redirects.length})
            </span>
          </div>

          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 size-3.5 text-[#646970] rtl:right-2.5 rtl:left-auto" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={dict["admin.common.search"] || ""}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white py-1 pr-3 pl-8 text-[12px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none rtl:pr-8 rtl:pl-3"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#646970]">
              {dict["admin.tools.no_redirects"] || ""}
            </div>
          ) : (
            <table className="w-full border-collapse text-start text-[13px]">
              <thead className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[#1d2327]">
                <tr>
                  <th className="p-3 text-start font-semibold">
                    {dict["admin.tools.source_url"] || ""}
                  </th>
                  <th className="p-3 text-start font-semibold">
                    {dict["admin.tools.target_url"] || ""}
                  </th>
                  <th className="p-3 text-start font-semibold">
                    {dict["admin.tools.type"] || ""}
                  </th>
                  <th className="p-3 text-start font-semibold">
                    {dict["admin.tools.hits"] || ""}
                  </th>
                  <th className="p-3 text-start font-semibold">
                    {dict["admin.tools.actions"] || ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f1]">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f6f7f7]/60">
                    <td className="max-w-xs truncate p-3 font-mono font-medium text-[#2271b1]">
                      {item.sourcePath}
                    </td>
                    <td className="max-w-xs truncate p-3 font-mono text-[#50575e]">
                      {item.targetUrl}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                          item.statusCode === 301
                            ? "border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]"
                            : "border-[#c5d9ed] bg-[#f0f6fc] text-[#2271b1]"
                        }`}
                      >
                        {item.statusCode}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#1d2327]">
                      {item.hits}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={safeMediaUrl(item.sourcePath) || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-[#2271b1] hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          {dict["admin.tools.test"] || ""}
                        </a>
                        <span className="text-[#c3c4c7]">|</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex cursor-pointer items-center gap-1 text-[12px] text-[#d63638] hover:underline"
                        >
                          <Trash2 className="size-3" />
                          {dict["admin.common.delete"] || ""}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
