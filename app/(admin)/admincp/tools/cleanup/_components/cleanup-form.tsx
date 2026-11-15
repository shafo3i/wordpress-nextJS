"use client"

import { useState } from "react"
import {
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import type { CleanupStats } from "@/services/database-maintenance.service"
import {
  getDatabaseCleanupStatsAction,
  runDatabaseCleanupAction,
} from "../actions"

interface CleanupFormProps {
  initialStats: CleanupStats
  dict: Record<string, string>
}

export function CleanupForm({ initialStats, dict }: CleanupFormProps) {
  const [stats, setStats] = useState<CleanupStats>(initialStats)
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [isCleaning, setIsCleaning] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    cleanedCount: number
    vacuumRun: boolean
    details: Record<string, number>
  } | null>(null)

  const cleanupItems = [
    {
      id: "revisions",
      title: dict["admin.tools.cleanup_revisions"] || "",
      desc: dict["admin.tools.cleanup_revisions_desc"] || "",
      count: stats.revisions,
    },
    {
      id: "auto_drafts",
      title: dict["admin.tools.cleanup_drafts"] || "",
      desc: dict["admin.tools.cleanup.abandoned_drafts_description"] || "",
      count: stats.autoDrafts,
    },
    {
      id: "spam_comments",
      title: dict["admin.tools.cleanup_comments"] || "",
      desc: dict["admin.tools.cleanup_comments_desc"] || "",
      count: stats.spamComments + stats.trashedComments,
    },
    {
      id: "orphaned_meta",
      title: dict["admin.tools.cleanup_meta"] || "",
      desc: dict["admin.tools.cleanup_meta_desc"] || "",
      count: stats.orphanedPostMeta,
    },
    {
      id: "orphaned_terms",
      title: dict["admin.tools.cleanup_terms"] || "",
      desc: dict["admin.tools.cleanup_terms_desc"] || "",
      count: stats.orphanedTermRelationships,
    },
    {
      id: "transients",
      title: dict["admin.tools.cleanup_transients"] || "",
      desc: dict["admin.tools.cleanup_transients_desc"] || "",
      count: stats.expiredTransients,
    },
  ]

  const handleToggle = (id: string) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const refreshStats = async () => {
    setIsRefreshing(true)
    try {
      const res = await getDatabaseCleanupStatsAction()
      if (res.success && res.stats) {
        setStats(res.stats)
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRunCleanup = async () => {
    if (selectedActions.length === 0) {
      setError(dict["admin.tools.select_action_error"] || "")
      return
    }

    setIsCleaning(true)
    setError(null)
    setResult(null)

    try {
      const res = await runDatabaseCleanupAction(selectedActions)
      if (!res.success || !res.result) {
        throw new Error(res.error || dict["admin.tools.error.failed"])
      }

      setResult({
        cleanedCount: res.result.cleanedCount,
        vacuumRun: res.result.vacuumRun,
        details: res.result.details,
      })

      if (res.result.details.vacuum_failed)
        setError(dict["admin.tools.error.vacuum"] || "")
      const updated = await getDatabaseCleanupStatsAction()
      if (updated.success && updated.stats) {
        setStats(updated.stats)
      }
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1d2327]">
              {dict["admin.tools.cleanup_title"] || ""}
            </h2>
            <p className="mt-0.5 text-[13px] text-[#50575e]">
              {dict["admin.tools.cleanup_subtitle"] || ""}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshStats}
            disabled={isRefreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#2c3338] hover:border-[#8c8f94]"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {dict["admin.tools.refresh_stats"] || ""}
          </button>
        </div>

        {/* Checklist */}
        <div className="divide-y divide-[#f0f0f1] overflow-hidden rounded-[3px] border border-[#dcdcde]">
          {cleanupItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className="flex cursor-pointer items-center justify-between p-3.5 transition-colors hover:bg-[#f6f7f7]/60"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedActions.includes(item.id)}
                  onChange={() => {}}
                  className="pointer-events-none mt-0.5 rounded text-[#2271b1] focus:ring-[#2271b1]"
                />
                <div>
                  <span className="block text-[13px] font-semibold text-[#1d2327]">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-[#646970]">
                    {item.desc}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`inline-block rounded px-2.5 py-0.5 text-[12px] font-semibold ${
                    item.count > 0
                      ? "border border-[#f5c6cb] bg-[#fcf0f1] text-[#d63638]"
                      : "bg-[#f0f0f1] text-[#646970]"
                  }`}
                >
                  {item.count} {dict["admin.tools.items"] || ""}
                </span>
              </div>
            </div>
          ))}

          {/* Vacuum Option */}
          <div
            onClick={() => handleToggle("vacuum")}
            className="flex cursor-pointer items-center justify-between bg-[#f0f6fc]/50 p-3.5 transition-colors hover:bg-[#f0f6fc]"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedActions.includes("vacuum")}
                onChange={() => {}}
                className="pointer-events-none mt-0.5 rounded text-[#2271b1] focus:ring-[#2271b1]"
              />
              <div>
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327]">
                  <Sparkles className="size-3.5 text-[#2271b1]" />
                  {dict["admin.tools.vacuum_title"] || ""}
                </span>
                <span className="mt-0.5 block text-[12px] text-[#50575e]">
                  {dict["admin.tools.vacuum_desc"] || ""}
                </span>
              </div>
            </div>
            <span className="rounded border border-[#c5d9ed] bg-white px-2 py-0.5 text-[11px] font-medium text-[#2271b1]">
              {dict["admin.tools.recommended"] || ""}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[3px] border border-[#d63638] bg-[#fcf0f1] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result alert */}
        {result && (
          <div className="space-y-2 rounded-[3px] border border-[#00a32a] bg-[#edfaef] p-4 text-[13px] text-[#1d2327]">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#00a32a]">
              <CheckCircle2 className="size-5" />
              <span>{dict["admin.tools.cleanup_success"] || ""}</span>
            </div>
            <p className="text-[13px] text-[#50575e]">
              {result.cleanedCount} {dict["admin.tools.records_removed"] || ""}
              {result.vacuumRun &&
                ` ${dict["admin.tools.vacuum_success"] || ""}`}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-[#f0f0f1] pt-4">
          <button
            type="button"
            disabled={isCleaning}
            onClick={handleRunCleanup}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#135e96] disabled:opacity-50"
          >
            {isCleaning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict["admin.tools.cleaning"] || ""}
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                {dict["admin.tools.run_cleanup_btn"] || ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
