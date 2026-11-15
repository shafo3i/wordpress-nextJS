"use client"

import { useState } from "react"
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react"
import type { SearchReplaceResult } from "@/services/database-maintenance.service"
import { runSearchReplaceAction } from "../actions"

interface SearchReplaceFormProps {
  dict: Record<string, string>
}

export function SearchReplaceForm({ dict }: SearchReplaceFormProps) {
  const [search, setSearch] = useState("")
  const [replace, setReplace] = useState("")
  const [dryRun, setDryRun] = useState(true)
  const [selectedTables, setSelectedTables] = useState<string[]>([
    "wp_posts",
    "wp_postmeta",
    "wp_options",
    "wp_comments",
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchReplaceResult | null>(null)

  const availableTables = [
    { id: "wp_posts", label: dict["admin.tools.table.wp_posts"] },
    { id: "wp_postmeta", label: dict["admin.tools.table.wp_postmeta"] },
    { id: "wp_options", label: dict["admin.tools.table.wp_options"] },
    { id: "wp_comments", label: dict["admin.tools.table.wp_comments"] },
  ]

  const handleTableToggle = (tableId: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableId)
        ? prev.filter((t) => t !== tableId)
        : [...prev, tableId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      setError(dict["admin.tools.search_required"] || "")
      return
    }
    if (selectedTables.length === 0) {
      setError(dict["admin.tools.select_tables_error"] || "")
      return
    }

    if (!dryRun && !window.confirm(dict["admin.tools.apply_confirm"])) return
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const res = await runSearchReplaceAction({
        search,
        replace,
        tables: selectedTables,
        dryRun,
      })

      if (!res.success || !res.result) {
        throw new Error(res.error || dict["admin.tools.error.failed"])
      }

      setResult(res.result)
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
      >
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {dict["admin.tools.search_replace_title"] || ""}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#50575e]">
            {dict["admin.tools.search_replace_desc"] || ""}
          </p>
        </div>

        <p className="text-[13px] text-[#50575e]">
          {dict["admin.tools.search_scope"]}
        </p>
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.tools.search_for"] || ""}
            </label>
            <input
              type="text"
              required
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dict["admin.tools.search_example"]}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.tools.replace_with"] || ""}
            </label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder={dict["admin.tools.replace_example"]}
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>
        </div>

        {/* Tables Checklist */}
        <div className="space-y-2 border-t border-[#f0f0f1] pt-4">
          <label className="block text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.tools.select_tables"] || ""}
          </label>
          <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
            {availableTables.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#2c3338]"
              >
                <input
                  type="checkbox"
                  checked={selectedTables.includes(t.id)}
                  onChange={() => handleTableToggle(t.id)}
                  className="rounded text-[#2271b1] focus:ring-[#2271b1]"
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dry Run Toggle */}
        <div className="border-t border-[#f0f0f1] pt-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-[#1d2327]">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="mt-0.5 rounded text-[#2271b1] focus:ring-[#2271b1]"
            />
            <div>
              <span className="block font-semibold">
                {dict["admin.tools.dry_run_label"] || ""}
              </span>
              <span className="block text-[12px] text-[#50575e]">
                {dict["admin.tools.dry_run_desc"] || ""}
              </span>
            </div>
          </label>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="flex items-start gap-2 rounded-[3px] border border-[#d63638] bg-[#fcf0f1] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-[#f0f0f1] pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[3px] px-5 py-2 text-[13px] font-medium text-white transition-colors disabled:opacity-50 ${
              dryRun
                ? "border border-[#2271b1] bg-[#2271b1] hover:bg-[#135e96]"
                : "border border-[#d63638] bg-[#d63638] hover:bg-[#b32d2e]"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict["admin.tools.scanning"] || ""}
              </>
            ) : dryRun ? (
              <>
                <Search className="size-4" />
                {dict["admin.tools.run_dry_run"] || ""}
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                {dict["admin.tools.execute_live_replace"] || ""}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Display */}
      {result && (
        <div className="overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3">
            <div className="flex items-center gap-2">
              {result.dryRun ? (
                <Info className="size-4 text-[#2271b1]" />
              ) : (
                <CheckCircle className="size-4 text-[#00a32a]" />
              )}
              <span className="text-[14px] font-semibold text-[#1d2327]">
                {result.dryRun
                  ? dict["admin.tools.dry_run_results"] || ""
                  : dict["admin.tools.live_replace_results"] || ""}
              </span>
            </div>
            <span className="rounded border border-[#c3c4c7] bg-white px-2 py-0.5 text-[12px] font-medium text-[#1d2327]">
              {result.totalMatches} {dict["admin.tools.matches_found"] || ""}
            </span>
          </div>

          <div className="p-4">
            {result.fields.length === 0 ? (
              <p className="py-3 text-center text-[13px] text-[#50575e]">
                {dict["admin.tools.no_matches"] || ""}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-[#dcdcde] text-start text-[13px]">
                  <thead className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[#1d2327]">
                    <tr>
                      <th className="p-2.5 text-start font-semibold">
                        {dict["admin.tools.table"] || ""}
                      </th>
                      <th className="p-2.5 text-start font-semibold">
                        {dict["admin.tools.field_column"] || ""}
                      </th>
                      <th className="p-2.5 text-start font-semibold">
                        {dict["admin.tools.matched_rows"] || ""}
                      </th>
                      <th className="p-2.5 text-start font-semibold">
                        {dict["admin.tools.status"] || ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f1]">
                    {result.fields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-[#f6f7f7]/50">
                        <td className="p-2.5 font-mono font-semibold text-[#2271b1]">
                          {f.table}
                        </td>
                        <td className="p-2.5 font-mono text-[#50575e]">
                          {f.field}
                        </td>
                        <td className="p-2.5 font-semibold text-[#1d2327]">
                          {f.matchedCount}
                        </td>
                        <td className="p-2.5">
                          {result.dryRun ? (
                            <span className="rounded border border-[#c5d9ed] bg-[#f0f6fc] px-2 py-0.5 text-[11px] font-medium text-[#2271b1]">
                              {dict["admin.tools.would_update"] || ""}
                            </span>
                          ) : (
                            <span className="rounded border border-[#b2e2bd] bg-[#edfaef] px-2 py-0.5 text-[11px] font-medium text-[#00a32a]">
                              {dict["admin.tools.updated"] || ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
