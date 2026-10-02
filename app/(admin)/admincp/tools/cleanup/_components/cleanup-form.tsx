"use client";

import { useState } from "react";
import { Trash2, Sparkles, CheckCircle2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type { CleanupStats } from "@/services/database-maintenance.service";
import { getDatabaseCleanupStatsAction, runDatabaseCleanupAction } from "../actions";

interface CleanupFormProps {
  initialStats: CleanupStats;
  dict: Record<string, string>;
}

export function CleanupForm({ initialStats, dict }: CleanupFormProps) {
  const [stats, setStats] = useState<CleanupStats>(initialStats);
  const [selectedActions, setSelectedActions] = useState<string[]>([
    "revisions",
    "auto_drafts",
    "spam_comments",
    "orphaned_meta",
    "orphaned_terms",
    "transients",
    "vacuum",
  ]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    cleanedCount: number;
    vacuumRun: boolean;
    details: Record<string, number>;
  } | null>(null);

  const cleanupItems = [
    {
      id: "revisions",
      title: dict["admin.tools.cleanup_revisions"] || "Post Revisions",
      desc: dict["admin.tools.cleanup_revisions_desc"] || "Old revisions and historical draft states.",
      count: stats.revisions,
    },
    {
      id: "auto_drafts",
      title: dict["admin.tools.cleanup_drafts"] || "Abandoned Auto-Drafts",
      desc: dict["admin.tools.cleanup_drafts_desc"] || "Unsaved draft posts created by editor sessions.",
      count: stats.autoDrafts,
    },
    {
      id: "spam_comments",
      title: dict["admin.tools.cleanup_comments"] || "Spam & Trashed Comments",
      desc: dict["admin.tools.cleanup_comments_desc"] || "Comments marked as spam or moved to the trash.",
      count: stats.spamComments + stats.trashedComments,
    },
    {
      id: "orphaned_meta",
      title: dict["admin.tools.cleanup_meta"] || "Orphaned Post Metadata",
      desc: dict["admin.tools.cleanup_meta_desc"] || "Key/value metadata records where the parent post was deleted.",
      count: stats.orphanedPostMeta,
    },
    {
      id: "orphaned_terms",
      title: dict["admin.tools.cleanup_terms"] || "Orphaned Taxonomy Relationships",
      desc: dict["admin.tools.cleanup_terms_desc"] || "Category/tag relations pointing to deleted post IDs.",
      count: stats.orphanedTermRelationships,
    },
    {
      id: "transients",
      title: dict["admin.tools.cleanup_transients"] || "Expired Transients in Options",
      desc: dict["admin.tools.cleanup_transients_desc"] || "Expired temporary cache items stored in wp_options.",
      count: stats.expiredTransients,
    },
  ];

  const handleToggle = (id: string) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await getDatabaseCleanupStatsAction();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunCleanup = async () => {
    if (selectedActions.length === 0) {
      setError(dict["admin.tools.select_action_error"] || "Please select at least one cleanup action.");
      return;
    }

    setIsCleaning(true);
    setError(null);
    setResult(null);

    try {
      const res = await runDatabaseCleanupAction(selectedActions as any);
      if (!res.success || !res.result) {
        throw new Error(res.error || "Failed to execute database cleanup.");
      }

      setResult({
        cleanedCount: res.result.cleanedCount,
        vacuumRun: res.result.vacuumRun,
        details: res.result.details,
      });

      const updated = await getDatabaseCleanupStatsAction();
      if (updated.success && updated.stats) {
        setStats(updated.stats);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during cleanup.");
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1d2327]">
              {dict["admin.tools.cleanup_title"] || "Database Optimization & Cleanup"}
            </h2>
            <p className="text-[13px] text-[#50575e] mt-0.5">
              {dict["admin.tools.cleanup_subtitle"] ||
                "Delete accumulated database bloat, orphaned entries, and reclaim disk space with PostgreSQL VACUUM."}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshStats}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1.5 text-[12px] font-medium text-[#2c3338] hover:border-[#8c8f94] cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {dict["admin.tools.refresh_stats"] || "Refresh Scan"}
          </button>
        </div>

        {/* Checklist */}
        <div className="divide-y divide-[#f0f0f1] border border-[#dcdcde] rounded-[3px] overflow-hidden">
          {cleanupItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className="flex items-center justify-between p-3.5 hover:bg-[#f6f7f7]/60 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedActions.includes(item.id)}
                  onChange={() => {}}
                  className="rounded text-[#2271b1] focus:ring-[#2271b1] mt-0.5 pointer-events-none"
                />
                <div>
                  <span className="text-[13px] font-semibold text-[#1d2327] block">
                    {item.title}
                  </span>
                  <span className="text-[12px] text-[#646970] block mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[12px] font-semibold ${
                    item.count > 0
                      ? "bg-[#fcf0f1] text-[#d63638] border border-[#f5c6cb]"
                      : "bg-[#f0f0f1] text-[#646970]"
                  }`}
                >
                  {item.count} {dict["admin.tools.items"] || "items"}
                </span>
              </div>
            </div>
          ))}

          {/* Vacuum Option */}
          <div
            onClick={() => handleToggle("vacuum")}
            className="flex items-center justify-between p-3.5 bg-[#f0f6fc]/50 hover:bg-[#f0f6fc] cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedActions.includes("vacuum")}
                onChange={() => {}}
                className="rounded text-[#2271b1] focus:ring-[#2271b1] mt-0.5 pointer-events-none"
              />
              <div>
                <span className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#2271b1]" />
                  {dict["admin.tools.vacuum_title"] || "Run PostgreSQL VACUUM (ANALYZE)"}
                </span>
                <span className="text-[12px] text-[#50575e] block mt-0.5">
                  {dict["admin.tools.vacuum_desc"] ||
                    "Reclaims physical disk storage and updates query optimizer statistics across all tables."}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#2271b1] bg-white border border-[#c5d9ed] px-2 py-0.5 rounded">
              {dict["admin.tools.recommended"] || "Recommended"}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[3px] bg-[#fcf0f1] border border-[#d63638] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Result alert */}
        {result && (
          <div className="rounded-[3px] bg-[#edfaef] border border-[#00a32a] p-4 text-[13px] text-[#1d2327] space-y-2">
            <div className="flex items-center gap-2 text-[#00a32a] font-semibold text-[14px]">
              <CheckCircle2 className="size-5" />
              <span>{dict["admin.tools.cleanup_success"] || "Cleanup completed successfully!"}</span>
            </div>
            <p className="text-[13px] text-[#50575e]">
              {result.cleanedCount} {dict["admin.tools.records_removed"] || "unneeded database records were deleted."}
              {result.vacuumRun && ` ${dict["admin.tools.vacuum_success"] || "PostgreSQL VACUUM ANALYZE completed."}`}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-[#f0f0f1] pt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={isCleaning}
            onClick={handleRunCleanup}
            className="inline-flex items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isCleaning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict["admin.tools.cleaning"] || "Optimizing Database..."}
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                {dict["admin.tools.run_cleanup_btn"] || "Run Selected Cleanups"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
