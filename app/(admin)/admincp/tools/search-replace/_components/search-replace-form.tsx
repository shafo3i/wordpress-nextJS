"use client";

import { useState } from "react";
import { Search, RefreshCw, AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import type { SearchReplaceResult } from "@/services/database-maintenance.service";
import { runSearchReplaceAction } from "../actions";

interface SearchReplaceFormProps {
  dict: Record<string, string>;
}

export function SearchReplaceForm({ dict }: SearchReplaceFormProps) {
  const [search, setSearch] = useState("");
  const [replace, setReplace] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [selectedTables, setSelectedTables] = useState<string[]>([
    "wp_posts",
    "wp_postmeta",
    "wp_options",
    "wp_comments",
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchReplaceResult | null>(null);

  const availableTables = [
    { id: "wp_posts", label: "wp_posts (Content, titles, excerpts, GUIDs)" },
    { id: "wp_postmeta", label: "wp_postmeta (Custom fields & post metadata)" },
    { id: "wp_options", label: "wp_options (Site settings & serialized widget/theme JSON)" },
    { id: "wp_comments", label: "wp_comments (Comment content & author URLs)" },
  ];

  const handleTableToggle = (tableId: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableId) ? prev.filter((t) => t !== tableId) : [...prev, tableId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      setError(dict["admin.tools.search_required"] || "Search text is required.");
      return;
    }
    if (selectedTables.length === 0) {
      setError(dict["admin.tools.select_tables_error"] || "Please select at least one table to scan.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await runSearchReplaceAction({
        search,
        replace,
        tables: selectedTables,
        dryRun,
      });

      if (!res.success || !res.result) {
        throw new Error(res.error || "Failed to execute search and replace.");
      }

      setResult(res.result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-6"
      >
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {dict["admin.tools.search_replace_title"] || "Search & Replace Database Strings"}
          </h2>
          <p className="text-[13px] text-[#50575e] mt-1 leading-relaxed">
            {dict["admin.tools.search_replace_desc"] ||
              "Safely scan and replace URLs, domain names, or text strings across your database. Safely deserializes JSON columns (such as theme customizer and widget configs) without corrupting structure."}
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">
              {dict["admin.tools.search_for"] || "Search for"}
            </label>
            <input
              type="text"
              required
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. http://localhost:3000"
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">
              {dict["admin.tools.replace_with"] || "Replace with"}
            </label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="e.g. https://signalnews.com"
              className="w-full rounded-[3px] border border-[#8c8f94] bg-white px-3 py-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
            />
          </div>
        </div>

        {/* Tables Checklist */}
        <div className="space-y-2 border-t border-[#f0f0f1] pt-4">
          <label className="block text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.tools.select_tables"] || "Select Tables to Scan"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {availableTables.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-2.5 text-[13px] text-[#2c3338] cursor-pointer"
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
          <label className="flex items-start gap-2.5 text-[13px] text-[#1d2327] cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded text-[#2271b1] focus:ring-[#2271b1] mt-0.5"
            />
            <div>
              <span className="font-semibold block">
                {dict["admin.tools.dry_run_label"] || "Run as a Dry Run (Recommended first)"}
              </span>
              <span className="text-[12px] text-[#50575e] block">
                {dict["admin.tools.dry_run_desc"] ||
                  "If checked, no changes will be written to the database. You will see a detailed report of how many instances would be replaced."}
              </span>
            </div>
          </label>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="flex items-start gap-2 rounded-[3px] bg-[#fcf0f1] border border-[#d63638] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-[#f0f0f1] pt-4 flex items-center justify-between">
          <button
            type="submit"
            disabled={isProcessing}
            className={`inline-flex items-center gap-2 rounded-[3px] px-5 py-2 text-[13px] font-medium text-white transition-colors cursor-pointer disabled:opacity-50 ${
              dryRun
                ? "bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1]"
                : "bg-[#d63638] hover:bg-[#b32d2e] border border-[#d63638]"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict["admin.tools.scanning"] || "Scanning Database..."}
              </>
            ) : dryRun ? (
              <>
                <Search className="size-4" />
                {dict["admin.tools.run_dry_run"] || "Run Dry Run"}
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                {dict["admin.tools.execute_live_replace"] || "Execute Live Replace (Write to DB)"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Display */}
      {result && (
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.dryRun ? (
                <Info className="size-4 text-[#2271b1]" />
              ) : (
                <CheckCircle className="size-4 text-[#00a32a]" />
              )}
              <span className="text-[14px] font-semibold text-[#1d2327]">
                {result.dryRun
                  ? (dict["admin.tools.dry_run_results"] || "Dry Run Results (No database changes made)")
                  : (dict["admin.tools.live_replace_results"] || "Live Replacement Completed Successfully")}
              </span>
            </div>
            <span className="text-[12px] font-medium px-2 py-0.5 rounded bg-white border border-[#c3c4c7] text-[#1d2327]">
              {result.totalMatches} {dict["admin.tools.matches_found"] || "matches found"}
            </span>
          </div>

          <div className="p-4">
            {result.fields.length === 0 ? (
              <p className="text-[13px] text-[#50575e] py-3 text-center">
                {dict["admin.tools.no_matches"] || "No matching occurrences found in the selected tables."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-[13px] border border-[#dcdcde]">
                  <thead className="bg-[#f6f7f7] text-[#1d2327] border-b border-[#dcdcde]">
                    <tr>
                      <th className="p-2.5 text-start font-semibold">{dict["admin.tools.table"] || "Table"}</th>
                      <th className="p-2.5 text-start font-semibold">{dict["admin.tools.field_column"] || "Column"}</th>
                      <th className="p-2.5 text-start font-semibold">{dict["admin.tools.matched_rows"] || "Matched Rows"}</th>
                      <th className="p-2.5 text-start font-semibold">{dict["admin.tools.status"] || "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f1]">
                    {result.fields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-[#f6f7f7]/50">
                        <td className="p-2.5 font-mono text-[#2271b1] font-semibold">{f.table}</td>
                        <td className="p-2.5 font-mono text-[#50575e]">{f.field}</td>
                        <td className="p-2.5 font-semibold text-[#1d2327]">{f.matchedCount}</td>
                        <td className="p-2.5">
                          {result.dryRun ? (
                            <span className="text-[11px] font-medium text-[#2271b1] bg-[#f0f6fc] border border-[#c5d9ed] px-2 py-0.5 rounded">
                              {dict["admin.tools.would_update"] || "Would update"}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-[#00a32a] bg-[#edfaef] border border-[#b2e2bd] px-2 py-0.5 rounded">
                              {dict["admin.tools.updated"] || "Updated"}
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
  );
}
