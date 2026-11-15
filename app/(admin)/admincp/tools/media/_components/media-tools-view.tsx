"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Image as ImageIcon,
  Sparkles,
  Trash2,
  FolderArchive,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  FileQuestion,
  Layers,
  Search,
} from "lucide-react"
import type {
  MediaOverviewStats,
  OrphanScanResult,
} from "@/services/media-tools.service"
import {
  getMediaStatsAction,
  regenerateThumbnailsAction,
  scanOrphanMediaAction,
  cleanOrphanMediaAction,
} from "../actions"

interface MediaToolsViewProps {
  initialStats: MediaOverviewStats
  dict: Record<string, string>
  direction: "rtl" | "ltr"
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function MediaToolsView({
  initialStats,
  dict,
  direction,
}: MediaToolsViewProps) {
  const [activeTab, setActiveTab] = useState<"regenerate" | "orphans">(
    "regenerate"
  )
  const [stats, setStats] = useState<MediaOverviewStats>(initialStats)
  const [isScanningStorage, setIsScanningStorage] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Thumbnail regeneration states
  const [generateWebp, setGenerateWebp] = useState(true)
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenLogs, setRegenLogs] = useState<
    Array<{
      id: number
      title: string
      sizes: string[]
      success: boolean
      error?: string
    }>
  >([])
  const [regenSummary, setRegenSummary] = useState<{
    processed: number
    totalSizes: number
  } | null>(null)

  // Orphan scanning states
  const [isScanningOrphans, setIsScanningOrphans] = useState(false)
  const [orphanScanResult, setOrphanScanResult] =
    useState<OrphanScanResult | null>(null)
  const [selectedOrphans, setSelectedOrphans] = useState<Set<string>>(new Set())
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanMessage, setCleanMessage] = useState<string | null>(null)

  async function refreshStats() {
    if (isScanningStorage) return
    setIsScanningStorage(true)
    setStorageError(null)
    try {
      const res = await getMediaStatsAction()
      if (res.success && res.stats) {
        setStats(res.stats)
      } else setStorageError(res.error || dict["admin.tools.error.failed"])
    } catch {
      setStorageError(dict["admin.tools.error.failed"])
    } finally {
      setIsScanningStorage(false)
    }
  }

  async function handleStartRegeneration() {
    setIsRegenerating(true)
    setRegenLogs([])
    setRegenSummary(null)

    try {
      let afterId: number | undefined
      let processed = 0,
        totalSizes = 0
      do {
        const res = await regenerateThumbnailsAction({
          generateWebp,
          onlyMissing,
          afterId,
        })
        if (!res.success || !res.data)
          throw new Error(res.error || dict["admin.tools.error.failed"])
        const batch = res.data
        setRegenLogs((previous) => [
          ...previous,
          ...batch.details.map((item) => ({
            id: item.id,
            title: item.title,
            sizes: item.sizesCreated,
            success: item.success,
            error: item.error
              ? dict[item.error] || dict["admin.tools.error.failed"]
              : undefined,
          })),
        ])
        processed += batch.processed
        totalSizes += batch.totalSizesGenerated
        setRegenSummary({ processed, totalSizes })
        if (
          batch.nextAfterId !== undefined &&
          afterId !== undefined &&
          batch.nextAfterId <= afterId
        )
          throw new Error(dict["admin.tools.error.failed"])
        afterId = batch.nextAfterId
      } while (afterId !== undefined)
    } catch {
      alert(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsRegenerating(false)
    }
  }

  async function handleScanOrphans() {
    setIsScanningOrphans(true)
    setCleanMessage(null)
    try {
      const res = await scanOrphanMediaAction()
      if (res.success && res.data) {
        setOrphanScanResult(res.data)
        setSelectedOrphans(new Set())
      } else {
        alert(res.error || dict["admin.tools.error.failed"])
      }
    } catch {
      alert(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsScanningOrphans(false)
    }
  }

  function toggleSelectAllOrphans() {
    if (!orphanScanResult) return
    if (selectedOrphans.size === orphanScanResult.orphanFiles.length) {
      setSelectedOrphans(new Set())
    } else {
      setSelectedOrphans(
        new Set(orphanScanResult.orphanFiles.map((f) => f.relativePath))
      )
    }
  }

  function toggleSelectOrphan(relPath: string) {
    const next = new Set(selectedOrphans)
    if (next.has(relPath)) {
      next.delete(relPath)
    } else {
      next.add(relPath)
    }
    setSelectedOrphans(next)
  }

  async function handleCleanOrphans(action: "quarantine" | "delete") {
    if (selectedOrphans.size === 0) return

    if (action === "delete") {
      const confirmDelete = window.confirm(
        dict["admin.tools.media.confirm_delete_orphan"] || ""
      )
      if (!confirmDelete) return
    }

    setIsCleaning(true)
    try {
      const res = await cleanOrphanMediaAction(
        Array.from(selectedOrphans),
        action
      )

      if (res.success && res.data) {
        setOrphanScanResult(null)
        setSelectedOrphans(new Set())
        setCleanMessage(
          `${dict["admin.tools.media.clean_success"] || ""} ${res.data.cleanedCount} ${dict["admin.tools.media.files_reclaimed"]} (${formatBytes(res.data.reclaimedBytes)}). ${res.data.failedCount ? dict["admin.tools.media.partial_cleanup"] : ""}`
        )
      } else {
        alert(res.error || dict["admin.tools.error.failed"])
      }
    } catch {
      alert(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* WordPress Admin Page Header */}
      <div className="border-b border-[#c3c4c7] pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-[#646970]">
              <Link href="/admincp/tools" className="hover:text-[#2271b1]">
                {dict["admin.menu.tools"] || ""}
              </Link>
              <span>/</span>
              <span>{dict["admin.menu.media_tools"] || ""}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1d2327]">
              {dict["admin.tools.media_title"] || ""}
            </h1>
            <p className="mt-1 text-sm text-[#646970]">
              {dict["admin.tools.media_desc"] || ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshStats}
              disabled={
                isScanningStorage ||
                isRegenerating ||
                isCleaning ||
                isScanningOrphans
              }
              className="inline-flex items-center gap-1.5 rounded border border-[#2271b1] bg-white px-3 py-1.5 text-xs font-medium text-[#2271b1] transition-colors hover:bg-[#f0f0f1]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>
                {dict[
                  isScanningStorage
                    ? "admin.tools.storage.scanning"
                    : "admin.tools.storage.scan"
                ] || ""}
              </span>
            </button>
          </div>
        </div>

        <p className="text-[13px] text-[#50575e]">
          {dict["admin.tools.media.scan_scope"]}
        </p>
        <p className="text-[13px] text-[#50575e]">
          {dict["admin.tools.storage.manual_hint"]}
        </p>
        <p className="text-[12px] text-[#646970]">
          {stats.scannedAt
            ? dict["admin.tools.storage.last_scan"].replace(
                "{time}",
                new Date(stats.scannedAt).toISOString()
              )
            : dict["admin.tools.storage.not_scanned"]}
        </p>
        {storageError && (
          <p role="alert" className="text-[13px] text-[#d63638]">
            {storageError}
          </p>
        )}
        {/* Authentic WordPress Navigation Tabs */}
        <div className="mt-6 flex items-center gap-1 border-b border-[#c3c4c7]">
          <button
            onClick={() => setActiveTab("regenerate")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "regenerate"
                ? "border-[#2271b1] bg-white font-semibold text-[#2271b1] shadow-sm"
                : "border-transparent text-[#50575e] hover:bg-[#f6f7f7] hover:text-[#2271b1]"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>{dict["admin.tools.media.tab_regenerate"] || ""}</span>
          </button>

          <button
            onClick={() => setActiveTab("orphans")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "orphans"
                ? "border-[#2271b1] bg-white font-semibold text-[#2271b1] shadow-sm"
                : "border-transparent text-[#50575e] hover:bg-[#f6f7f7] hover:text-[#2271b1]"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>{dict["admin.tools.media.tab_orphans"] || ""}</span>
          </button>
        </div>
      </div>

      {/* Global Storage Overview Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-[#c3c4c7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.total_attachments"] || ""}
            </span>
            <ImageIcon className="h-4 w-4 text-[#2271b1]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1d2327]">
            {stats.attachmentCount}
          </p>
        </div>

        <div className="rounded border border-[#c3c4c7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.physical_files"] || ""}
            </span>
            <Layers className="h-4 w-4 text-[#2271b1]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1d2327]">
            {stats.physicalFilesCount ??
              dict["admin.tools.storage.not_scanned"]}
          </p>
        </div>

        <div className="rounded border border-[#c3c4c7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.storage_used"] || ""}
            </span>
            <HardDrive className="h-4 w-4 text-[#2271b1]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1d2327]">
            {stats.totalDiskUsageBytes === null
              ? dict["admin.tools.storage.not_scanned"]
              : formatBytes(stats.totalDiskUsageBytes)}
          </p>
        </div>

        <div className="rounded border border-[#c3c4c7] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.configured_sizes"] || ""}
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1d2327]">
            {stats.configuredSizes.length}
          </p>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-[#646970]">
            {stats.configuredSizes.map((s) => (
              <span key={s.name} className="rounded bg-[#f0f0f1] px-1.5 py-0.5">
                {s.name} ({s.width}x{s.height})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: THUMBNAIL REGENERATOR & WEBP */}
      {activeTab === "regenerate" && (
        <div className="space-y-6">
          <div className="rounded border border-[#c3c4c7] bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#1d2327]">
              {dict["admin.tools.media.regen_title"] || ""}
            </h2>
            <p className="mb-6 text-sm text-[#646970]">
              {dict["admin.tools.media.regen_desc"] || ""}
            </p>

            {stats.attachmentCount === 0 && (
              <p className="mb-6 text-[13px] text-[#50575e]">
                {dict["admin.tools.media.no_attachments"]}
              </p>
            )}
            {/* Options Form */}
            <div className="mb-6 space-y-4 border-t border-[#f0f0f1] pt-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={generateWebp}
                  onChange={(e) => setGenerateWebp(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
                <div>
                  <span className="text-sm font-medium text-[#1d2327]">
                    {dict["admin.tools.media.opt_generate_webp"] || ""}
                  </span>
                  <p className="text-xs text-[#646970]">
                    {dict["admin.tools.media.webp_help"]}
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={onlyMissing}
                  onChange={(e) => setOnlyMissing(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
                <div>
                  <span className="text-sm font-medium text-[#1d2327]">
                    {dict["admin.tools.media.opt_only_missing"] || ""}
                  </span>
                  <p className="text-xs text-[#646970]">
                    {dict["admin.tools.media.missing_help"]}
                  </p>
                </div>
              </label>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleStartRegeneration}
                disabled={
                  isRegenerating ||
                  isScanningStorage ||
                  stats.attachmentCount === 0
                }
                className="flex items-center gap-2 rounded bg-[#2271b1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>
                      {dict["admin.tools.media.btn_regenerating"] || ""}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {dict["admin.tools.media.btn_start_regen"] || ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary & Real-time Logs */}
          {regenSummary && (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">
                  {dict["admin.tools.media.regen_complete"] || ""}
                </h3>
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                {dict["admin.tools.media.regen_summary"]
                  .replace("{processed}", String(regenSummary.processed))
                  .replace("{sizes}", String(regenSummary.totalSizes))}
              </p>
            </div>
          )}

          {regenLogs.length > 0 && (
            <div className="overflow-hidden rounded border border-[#c3c4c7] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3">
                <span className="text-xs font-bold tracking-wider text-[#1d2327] uppercase">
                  {dict["admin.tools.media.progress_label"] || ""}
                </span>
                <span className="text-xs text-[#646970]">
                  {regenLogs.length} {dict["admin.tools.files"]}
                </span>
              </div>
              <div className="max-h-96 divide-y divide-[#f0f0f1] overflow-y-auto font-mono text-xs">
                {regenLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 p-3"
                  >
                    <div>
                      <div className="font-semibold text-[#1d2327]">
                        #{log.id} — {log.title}
                      </div>
                      {log.sizes.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-[#646970]">
                          {log.sizes.map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700"
                            >
                              + {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {log.error && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {log.error}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${
                        log.success
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.success ? "SUCCESS" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORPHAN MEDIA CLEANER */}
      {activeTab === "orphans" && (
        <div className="space-y-6">
          <div className="rounded border border-[#c3c4c7] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1d2327]">
                  {dict["admin.tools.media.orphans_title"] || ""}
                </h2>
                <p className="mt-1 text-sm text-[#646970]">
                  {dict["admin.tools.media.orphans_desc"] || ""}
                </p>
              </div>

              <button
                onClick={handleScanOrphans}
                disabled={isScanningOrphans || isScanningStorage}
                className="flex shrink-0 items-center gap-1.5 rounded bg-[#2271b1] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#135e96] disabled:opacity-50"
              >
                {isScanningOrphans ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      {dict["admin.tools.media.scanning_orphans"] || ""}
                    </span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    <span>
                      {dict["admin.tools.media.btn_scan_orphans"] || ""}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Metrics */}
            {orphanScanResult && (
              <div className="mb-6 grid grid-cols-1 gap-4 border-t border-[#f0f0f1] pt-6 sm:grid-cols-3">
                <div className="rounded border border-[#dcdcde] bg-[#f6f7f7] p-3">
                  <span className="text-xs text-[#646970]">
                    {dict["admin.tools.media.in_use_files"] || ""}
                  </span>
                  <p className="mt-1 text-xl font-bold text-[#1d2327]">
                    {orphanScanResult.inUseCount}
                  </p>
                </div>
                <div className="rounded border border-[#dcdcde] bg-[#f6f7f7] p-3">
                  <span className="text-xs text-[#646970]">
                    {dict["admin.tools.media.total_orphans"] || ""}
                  </span>
                  <p className="mt-1 text-xl font-bold text-amber-700">
                    {orphanScanResult.orphanCount}
                  </p>
                </div>
                <div className="rounded border border-[#dcdcde] bg-[#f6f7f7] p-3">
                  <span className="text-xs text-[#646970]">
                    {dict["admin.tools.media.wasted_storage"] || ""}
                  </span>
                  <p className="mt-1 text-xl font-bold text-[#2271b1]">
                    {formatBytes(orphanScanResult.reclaimableBytes)}
                  </p>
                </div>
              </div>
            )}

            {cleanMessage && (
              <div className="mb-6 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{cleanMessage}</span>
              </div>
            )}

            {/* Orphan Results Table */}
            {orphanScanResult && orphanScanResult.orphanFiles.length === 0 ? (
              <div className="rounded border border-[#cce5ff] bg-[#f0f6fc] p-6 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                <h3 className="text-sm font-semibold text-[#1d2327]">
                  {dict["admin.tools.media.no_orphans"] || ""}
                </h3>
              </div>
            ) : orphanScanResult && orphanScanResult.orphanFiles.length > 0 ? (
              <div className="space-y-4">
                {/* Batch Actions Bar */}
                <div className="flex flex-col justify-between gap-3 rounded border border-[#c3c4c7] bg-[#f6f7f7] p-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1d2327]">
                      <input
                        type="checkbox"
                        checked={
                          selectedOrphans.size ===
                            orphanScanResult.orphanFiles.length &&
                          orphanScanResult.orphanFiles.length > 0
                        }
                        onChange={toggleSelectAllOrphans}
                        className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                      />
                      <span>
                        {dict["admin.tools.media.selected_count"]
                          .replace("{selected}", String(selectedOrphans.size))
                          .replace(
                            "{total}",
                            String(orphanScanResult.orphanFiles.length)
                          )}
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCleanOrphans("quarantine")}
                      disabled={
                        selectedOrphans.size === 0 ||
                        isCleaning ||
                        isScanningStorage
                      }
                      className="flex items-center gap-1.5 rounded border border-[#2271b1] bg-white px-3 py-1.5 text-xs font-semibold text-[#2271b1] transition-colors hover:bg-[#f0f0f1] disabled:opacity-50"
                    >
                      <FolderArchive className="h-3.5 w-3.5" />
                      <span>
                        {dict["admin.tools.media.btn_quarantine_selected"] ||
                          ""}
                      </span>
                    </button>

                    <button
                      onClick={() => handleCleanOrphans("delete")}
                      disabled={
                        selectedOrphans.size === 0 ||
                        isCleaning ||
                        isScanningStorage
                      }
                      className="flex items-center gap-1.5 rounded bg-[#b32d2e] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#a02223] disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>
                        {dict["admin.tools.media.btn_delete_selected"] || ""}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded border border-[#c3c4c7] bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-[#1d2327]">
                        <th className="w-10 p-3 text-center">
                          <span className="sr-only">
                            {dict["admin.tools.select"]}
                          </span>
                        </th>
                        <th className="p-3 font-semibold">
                          {dict["admin.tools.media.orphans_table_filename"] ||
                            ""}
                        </th>
                        <th className="p-3 font-semibold">
                          {dict["admin.tools.media.orphans_table_size"] || ""}
                        </th>
                        <th className="p-3 font-semibold">
                          {dict["admin.tools.media.orphans_table_modified"] ||
                            ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {orphanScanResult.orphanFiles.map((file) => (
                        <tr
                          key={file.relativePath}
                          className={`transition-colors hover:bg-[#f6f7f7] ${
                            selectedOrphans.has(file.relativePath)
                              ? "bg-[#f0f6fc]"
                              : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedOrphans.has(file.relativePath)}
                              onChange={() =>
                                toggleSelectOrphan(file.relativePath)
                              }
                              className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                            />
                          </td>
                          <td className="p-3 font-mono text-[#1d2327]">
                            <div className="flex items-center gap-2">
                              <FileQuestion className="h-4 w-4 shrink-0 text-amber-600" />
                              <span className="max-w-md truncate">
                                {file.relativePath}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-[#646970]">
                            {formatBytes(file.sizeBytes)}
                          </td>
                          <td className="p-3 text-[#646970]">
                            {new Date(file.modifiedAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
