"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Sparkles,
  Trash2,
  FolderArchive,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Layers,
  Search,
} from "lucide-react";
import type { MediaOverviewStats, OrphanScanResult, OrphanFileItem } from "@/services/media-tools.service";
import {
  getMediaStatsAction,
  regenerateThumbnailsAction,
  scanOrphanMediaAction,
  cleanOrphanMediaAction,
  seedSampleMediaAction,
} from "../actions";

interface MediaToolsViewProps {
  initialStats: MediaOverviewStats;
  dict: Record<string, string>;
  direction: "rtl" | "ltr";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function MediaToolsView({ initialStats, dict, direction }: MediaToolsViewProps) {
  const [activeTab, setActiveTab] = useState<"regenerate" | "orphans">("regenerate");
  const [stats, setStats] = useState<MediaOverviewStats>(initialStats);

  // Thumbnail regeneration states
  const [generateWebp, setGenerateWebp] = useState(true);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenLogs, setRegenLogs] = useState<Array<{ id: number; title: string; sizes: string[]; success: boolean; error?: string }>>([]);
  const [regenSummary, setRegenSummary] = useState<{ processed: number; totalSizes: number } | null>(null);

  // Demo seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  // Orphan scanning states
  const [isScanningOrphans, setIsScanningOrphans] = useState(false);
  const [orphanScanResult, setOrphanScanResult] = useState<OrphanScanResult | null>(null);
  const [selectedOrphans, setSelectedOrphans] = useState<Set<string>>(new Set());
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  async function refreshStats() {
    try {
      const res = await getMediaStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch {
      // ignore
    }
  }

  async function handleSeedDemoMedia() {
    setIsSeeding(true);
    setSeedSuccessMsg(null);
    try {
      const res = await seedSampleMediaAction();
      if (res.success) {
        setSeedSuccessMsg(dict["admin.tools.media.seed_success"] || `Created ${res.createdCount} sample photos!`);
        await refreshStats();
      } else {
        alert(res.error || "Failed to seed demo media");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to seed demo media");
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleStartRegeneration() {
    setIsRegenerating(true);
    setRegenLogs([]);
    setRegenSummary(null);

    try {
      const res = await regenerateThumbnailsAction({ generateWebp, onlyMissing });

      if (res.success && res.data) {
        setRegenLogs(
          res.data.details.map((d: any) => ({
            id: d.id,
            title: d.title,
            sizes: d.sizesCreated,
            success: d.success,
            error: d.error,
          }))
        );
        setRegenSummary({
          processed: res.data.processed,
          totalSizes: res.data.totalSizesGenerated,
        });
        await refreshStats();
      } else {
        alert(res.error || "Failed to regenerate thumbnails");
      }
    } catch (err: any) {
      alert(err?.message || "Error running thumbnail regeneration");
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleScanOrphans() {
    setIsScanningOrphans(true);
    setCleanMessage(null);
    try {
      const res = await scanOrphanMediaAction();
      if (res.success && res.data) {
        setOrphanScanResult(res.data);
        setSelectedOrphans(new Set());
      } else {
        alert(res.error || "Failed to scan orphan media");
      }
    } catch (err: any) {
      alert(err?.message || "Error scanning orphan media");
    } finally {
      setIsScanningOrphans(false);
    }
  }

  function toggleSelectAllOrphans() {
    if (!orphanScanResult) return;
    if (selectedOrphans.size === orphanScanResult.orphanFiles.length) {
      setSelectedOrphans(new Set());
    } else {
      setSelectedOrphans(new Set(orphanScanResult.orphanFiles.map((f) => f.relativePath)));
    }
  }

  function toggleSelectOrphan(relPath: string) {
    const next = new Set(selectedOrphans);
    if (next.has(relPath)) {
      next.delete(relPath);
    } else {
      next.add(relPath);
    }
    setSelectedOrphans(next);
  }

  async function handleCleanOrphans(action: "quarantine" | "delete") {
    if (selectedOrphans.size === 0) return;

    if (action === "delete") {
      const confirmDelete = window.confirm(
        dict["admin.tools.media.confirm_delete_orphan"] ||
          "Are you sure you want to permanently delete these orphan files? This cannot be undone."
      );
      if (!confirmDelete) return;
    }

    setIsCleaning(true);
    try {
      const res = await cleanOrphanMediaAction(Array.from(selectedOrphans), action);

      if (res.success && res.data) {
        setCleanMessage(
          `${dict["admin.tools.media.clean_success"] || "Cleaned"} ${res.data.cleanedCount} files (${formatBytes(res.data.reclaimedBytes)} reclaimed).`
        );
        await handleScanOrphans();
        await refreshStats();
      } else {
        alert(res.error || "Failed to clean orphan files");
      }
    } catch (err: any) {
      alert(err?.message || "Error cleaning orphan files");
    } finally {
      setIsCleaning(false);
    }
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* WordPress Admin Page Header */}
      <div className="border-b border-[#c3c4c7] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#646970] mb-1">
              <Link href="/admincp/tools" className="hover:text-[#2271b1]">
                {dict["admin.menu.tools"] || "Tools"}
              </Link>
              <span>/</span>
              <span>{dict["admin.menu.media_tools"] || "Media Utilities"}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1d2327]">
              {dict["admin.tools.media_title"] || "Media Utilities & Maintenance"}
            </h1>
            <p className="text-sm text-[#646970] mt-1">
              {dict["admin.tools.media_desc"] ||
                "Batch thumbnail regeneration, WebP compression, and orphan media storage cleanup."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshStats}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2271b1] bg-white border border-[#2271b1] rounded hover:bg-[#f0f0f1] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{dict["common.update"] || "Refresh Stats"}</span>
            </button>
          </div>
        </div>

        {/* Authentic WordPress Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6 border-b border-[#c3c4c7]">
          <button
            onClick={() => setActiveTab("regenerate")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "regenerate"
                ? "border-[#2271b1] text-[#2271b1] bg-white font-semibold shadow-sm"
                : "border-transparent text-[#50575e] hover:text-[#2271b1] hover:bg-[#f6f7f7]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{dict["admin.tools.media.tab_regenerate"] || "Thumbnail Regenerator & WebP"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("orphans");
              if (!orphanScanResult && !isScanningOrphans) {
                handleScanOrphans();
              }
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "orphans"
                ? "border-[#2271b1] text-[#2271b1] bg-white font-semibold shadow-sm"
                : "border-transparent text-[#50575e] hover:text-[#2271b1] hover:bg-[#f6f7f7]"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>{dict["admin.tools.media.tab_orphans"] || "Orphan Media Cleaner"}</span>
          </button>
        </div>
      </div>

      {/* Global Storage Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c3c4c7] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.total_attachments"] || "Image Attachments in DB"}
            </span>
            <ImageIcon className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-2xl font-bold text-[#1d2327] mt-2">{stats.attachmentCount}</p>
        </div>

        <div className="bg-white border border-[#c3c4c7] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.physical_files"] || "Physical Files in Uploads"}
            </span>
            <Layers className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-2xl font-bold text-[#1d2327] mt-2">{stats.physicalFilesCount}</p>
        </div>

        <div className="bg-white border border-[#c3c4c7] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.storage_used"] || "Total Storage Used"}
            </span>
            <HardDrive className="w-4 h-4 text-[#2271b1]" />
          </div>
          <p className="text-2xl font-bold text-[#1d2327] mt-2">{formatBytes(stats.totalDiskUsageBytes)}</p>
        </div>

        <div className="bg-white border border-[#c3c4c7] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#646970]">
              {dict["admin.tools.media.configured_sizes"] || "Configured Sizes"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[#1d2327] mt-2">{stats.configuredSizes.length}</p>
          <div className="text-[11px] text-[#646970] mt-1 flex flex-wrap gap-1">
            {stats.configuredSizes.map((s) => (
              <span key={s.name} className="bg-[#f0f0f1] px-1.5 py-0.5 rounded">
                {s.name} ({s.width}x{s.height})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: THUMBNAIL REGENERATOR & WEBP */}
      {activeTab === "regenerate" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#c3c4c7] rounded p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1d2327] mb-2">
              {dict["admin.tools.media.regen_title"] || "Regenerate Responsive Thumbnails"}
            </h2>
            <p className="text-sm text-[#646970] mb-6">
              {dict["admin.tools.media.regen_desc"] ||
                "Generate newly configured responsive image dimensions (Hero, Large, Medium, Thumbnail) and modern WebP formats across all published news stories."}
            </p>

            {/* Zero Attachments Notice with Seeder */}
            {stats.attachmentCount === 0 && (
              <div className="bg-[#f0f6fc] border border-[#cce5ff] p-4 rounded mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#2271b1] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1d2327]">
                      {dict["admin.tools.media.seed_demo_desc"] ||
                        "No image attachments exist yet in the database. You can generate sample editorial media to test thumbnail regeneration and orphan scanning."}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleSeedDemoMedia}
                  disabled={isSeeding}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2271b1] hover:bg-[#135e96] rounded shrink-0 transition-colors disabled:opacity-50"
                >
                  {isSeeding ? "Creating..." : dict["admin.tools.media.btn_seed_demo"] || "Generate Sample Media (Demo)"}
                </button>
              </div>
            )}

            {seedSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{seedSuccessMsg}</span>
              </div>
            )}

            {/* Options Form */}
            <div className="space-y-4 border-t border-[#f0f0f1] pt-6 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateWebp}
                  onChange={(e) => setGenerateWebp(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#2271b1] rounded border-[#8c8f94] focus:ring-[#2271b1]"
                />
                <div>
                  <span className="text-sm font-medium text-[#1d2327]">
                    {dict["admin.tools.media.opt_generate_webp"] ||
                      "Generate high-efficiency WebP variants (.webp) alongside original formats"}
                  </span>
                  <p className="text-xs text-[#646970]">
                    Creates modern WebP compressed files for all sizes, reducing article load times by up to 70%.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyMissing}
                  onChange={(e) => setOnlyMissing(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#2271b1] rounded border-[#8c8f94] focus:ring-[#2271b1]"
                />
                <div>
                  <span className="text-sm font-medium text-[#1d2327]">
                    {dict["admin.tools.media.opt_only_missing"] ||
                      "Only regenerate missing thumbnail sizes (skip existing files to save CPU)"}
                  </span>
                  <p className="text-xs text-[#646970]">
                    Recommended for large photo libraries to prevent re-processing existing thumbnail files.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleStartRegeneration}
                disabled={isRegenerating || stats.attachmentCount === 0}
                className="px-5 py-2.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-sm font-semibold rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{dict["admin.tools.media.btn_regenerating"] || "Processing Images..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{dict["admin.tools.media.btn_start_regen"] || "Start Thumbnail Regeneration"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Summary & Real-time Logs */}
          {regenSummary && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">
                  {dict["admin.tools.media.regen_complete"] || "Thumbnail regeneration complete!"}
                </h3>
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Successfully processed <strong>{regenSummary.processed}</strong> images and generated{" "}
                <strong>{regenSummary.totalSizes}</strong> responsive thumbnail and WebP files.
              </p>
            </div>
          )}

          {regenLogs.length > 0 && (
            <div className="bg-white border border-[#c3c4c7] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f6f7f7] px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center">
                <span className="text-xs font-bold text-[#1d2327] uppercase tracking-wider">
                  {dict["admin.tools.media.progress_label"] || "Processed Media Log"}
                </span>
                <span className="text-xs text-[#646970]">{regenLogs.length} items</span>
              </div>
              <div className="divide-y divide-[#f0f0f1] max-h-96 overflow-y-auto font-mono text-xs">
                {regenLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-[#1d2327]">
                        #{log.id} — {log.title}
                      </div>
                      {log.sizes.length > 0 ? (
                        <div className="text-[11px] text-[#646970] mt-1 flex flex-wrap gap-1">
                          {log.sizes.map((s, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                              + {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {log.error && <p className="text-red-600 text-[11px] mt-1">{log.error}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
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
          <div className="bg-white border border-[#c3c4c7] rounded p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1d2327]">
                  {dict["admin.tools.media.orphans_title"] || "Orphan & Unused Media Scanner"}
                </h2>
                <p className="text-sm text-[#646970] mt-1">
                  {dict["admin.tools.media.orphans_desc"] ||
                    "Scan public/uploads for image files that are no longer referenced in any article content, featured image, or site setting."}
                </p>
              </div>

              <button
                onClick={handleScanOrphans}
                disabled={isScanningOrphans}
                className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {isScanningOrphans ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{dict["admin.tools.media.scanning_orphans"] || "Scanning Storage..."}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>{dict["admin.tools.media.btn_scan_orphans"] || "Scan Uploads for Orphans"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Metrics */}
            {orphanScanResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#f0f0f1] pt-6 mb-6">
                <div className="bg-[#f6f7f7] border border-[#dcdcde] p-3 rounded">
                  <span className="text-xs text-[#646970]">
                    {dict["admin.tools.media.in_use_files"] || "Active Referenced Files"}
                  </span>
                  <p className="text-xl font-bold text-[#1d2327] mt-1">
                    {orphanScanResult.inUseCount}
                  </p>
                </div>
                <div className="bg-[#f6f7f7] border border-[#dcdcde] p-3 rounded">
                  <span className="text-xs text-[#646970]">
                    {dict["admin.tools.media.total_orphans"] || "Orphaned Files Found"}
                  </span>
                  <p className="text-xl font-bold text-amber-700 mt-1">
                    {orphanScanResult.orphanCount}
                  </p>
                </div>
                <div className="bg-[#f6f7f7] border border-[#dcdcde] p-3 rounded">
                  <span className="text-xs text-[#646970]">
                    {dict["admin.tools.media.wasted_storage"] || "Reclaimable Disk Space"}
                  </span>
                  <p className="text-xl font-bold text-[#2271b1] mt-1">
                    {formatBytes(orphanScanResult.reclaimableBytes)}
                  </p>
                </div>
              </div>
            )}

            {cleanMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-4 rounded mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{cleanMessage}</span>
              </div>
            )}

            {/* Orphan Results Table */}
            {orphanScanResult && orphanScanResult.orphanFiles.length === 0 ? (
              <div className="bg-[#f0f6fc] border border-[#cce5ff] p-6 rounded text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-[#1d2327]">
                  {dict["admin.tools.media.no_orphans"] ||
                    "All uploaded media files are actively referenced in the database. No orphans found!"}
                </h3>
              </div>
            ) : orphanScanResult && orphanScanResult.orphanFiles.length > 0 ? (
              <div className="space-y-4">
                {/* Batch Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f6f7f7] p-3 rounded border border-[#c3c4c7]">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-[#1d2327] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          selectedOrphans.size === orphanScanResult.orphanFiles.length &&
                          orphanScanResult.orphanFiles.length > 0
                        }
                        onChange={toggleSelectAllOrphans}
                        className="h-4 w-4 text-[#2271b1] rounded border-[#8c8f94] focus:ring-[#2271b1]"
                      />
                      <span>
                        Select All ({selectedOrphans.size} of {orphanScanResult.orphanFiles.length} selected)
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCleanOrphans("quarantine")}
                      disabled={selectedOrphans.size === 0 || isCleaning}
                      className="px-3 py-1.5 bg-white border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>{dict["admin.tools.media.btn_quarantine_selected"] || "Move to Quarantine"}</span>
                    </button>

                    <button
                      onClick={() => handleCleanOrphans("delete")}
                      disabled={selectedOrphans.size === 0 || isCleaning}
                      className="px-3 py-1.5 bg-[#b32d2e] hover:bg-[#a02223] text-white text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{dict["admin.tools.media.btn_delete_selected"] || "Delete Permanently"}</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-[#c3c4c7] rounded overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#1d2327]">
                        <th className="p-3 w-10 text-center">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="p-3 font-semibold">
                          {dict["admin.tools.media.orphans_table_filename"] || "File Name / Path"}
                        </th>
                        <th className="p-3 font-semibold">
                          {dict["admin.tools.media.orphans_table_size"] || "Size"}
                        </th>
                        <th className="p-3 font-semibold">
                          {dict["admin.tools.media.orphans_table_modified"] || "Last Modified"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1]">
                      {orphanScanResult.orphanFiles.map((file) => (
                        <tr
                          key={file.relativePath}
                          className={`hover:bg-[#f6f7f7] transition-colors ${
                            selectedOrphans.has(file.relativePath) ? "bg-[#f0f6fc]" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedOrphans.has(file.relativePath)}
                              onChange={() => toggleSelectOrphan(file.relativePath)}
                              className="h-4 w-4 text-[#2271b1] rounded border-[#8c8f94] focus:ring-[#2271b1]"
                            />
                          </td>
                          <td className="p-3 font-mono text-[#1d2327]">
                            <div className="flex items-center gap-2">
                              <FileQuestion className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="truncate max-w-md">{file.relativePath}</span>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-[#646970]">
                            {formatBytes(file.sizeBytes)}
                          </td>
                          <td className="p-3 text-[#646970]">
                            {new Date(file.modifiedAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
  );
}
