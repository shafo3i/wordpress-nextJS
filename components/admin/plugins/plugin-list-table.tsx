"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PluginManifest } from "@/lib/plugins/types";
import { bulkPluginsAction } from "@/app/(admin)/admincp/plugins/actions";
import { PluginRowItem } from "./plugin-row-item";

export function PluginListTable({
  plugins,
}: {
  plugins: PluginManifest[];
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const allSelected = plugins.length > 0 && selectedSlugs.length === plugins.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedSlugs(checked ? plugins.map((p) => p.slug) : []);
  };

  const toggleSelectOne = (slug: string, checked: boolean) => {
    setSelectedSlugs((curr) =>
      checked ? [...new Set([...curr, slug])] : curr.filter((s) => s !== slug)
    );
  };

  const handleApplyBulk = () => {
    if (!selectedSlugs.length) return;
    if (bulkAction !== "Activate" && bulkAction !== "Deactivate") return;

    startTransition(async () => {
      const action = bulkAction === "Activate" ? "activate" : "deactivate";
      const res = await bulkPluginsAction(selectedSlugs, action);
      if (res?.error) {
        setNotice({ type: "error", message: res.error });
      } else {
        setNotice({
          type: "success",
          message: `Selected plugins ${action === "activate" ? "activated" : "deactivated"}.`,
        });
        setSelectedSlugs([]);
        setBulkAction("Bulk actions");
        router.refresh();
      }
    });
  };

  const BulkControls = () => (
    <div className="flex items-center gap-1.5">
      <select
        value={bulkAction}
        onChange={(e) => setBulkAction(e.target.value)}
        disabled={isPending}
        className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none focus:ring-1 focus:ring-[#2271b1]"
      >
        <option value="Bulk actions">Bulk actions</option>
        <option value="Activate">Activate</option>
        <option value="Deactivate">Deactivate</option>
      </select>
      <button
        type="button"
        disabled={
          isPending ||
          (bulkAction !== "Activate" && bulkAction !== "Deactivate") ||
          !selectedSlugs.length
        }
        onClick={handleApplyBulk}
        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] transition-colors disabled:opacity-50"
      >
        {isPending ? "Applying..." : "Apply"}
      </button>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* WordPress Dismissible Notice */}
      {notice && (
        <div
          className={`flex items-center justify-between border-l-4 p-3 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.04)] ${
            notice.type === "success"
              ? "border-[#00a32a] bg-white text-[#1d2327]"
              : "border-[#d63638] bg-white text-[#1d2327]"
          }`}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex items-center justify-between text-[13px]">
        <BulkControls />
        <span className="text-[#646970]">
          {plugins.length} item{plugins.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Classic WordPress Plugins Table */}
      <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <table className="w-full min-w-[650px] border-collapse text-left text-[13px]">
          <thead className="border-b border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all plugins"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
              </th>
              <th className="px-3 py-2 font-semibold">Plugin</th>
              <th className="px-3 py-2 font-semibold">Description</th>
            </tr>
          </thead>

          <tbody>
            {plugins.length ? (
              plugins.map((plugin) => (
                <PluginRowItem
                  key={plugin.slug}
                  plugin={plugin}
                  isSelected={selectedSlugs.includes(plugin.slug)}
                  onToggleSelect={(checked) => toggleSelectOne(plugin.slug, checked)}
                  onNotice={setNotice}
                />
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[#646970]">
                  No plugins found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="border-t border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all plugins"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
              </th>
              <th className="px-3 py-2 font-semibold">Plugin</th>
              <th className="px-3 py-2 font-semibold">Description</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between text-[13px] pt-1">
        <BulkControls />
        <span className="text-[#646970]">
          {plugins.length} item{plugins.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
