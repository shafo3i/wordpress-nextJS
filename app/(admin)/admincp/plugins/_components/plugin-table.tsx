"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PluginManifest } from "@/lib/plugins/types";
import {
  activatePluginAction,
  deactivatePluginAction,
  uninstallPluginAction,
  bulkPluginsAction,
} from "../action";
import { PluginStatusBadge } from "./plugin-status-badge";
import { PluginTablenav } from "./plugin-tablenav";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type Props = {
  plugins: PluginManifest[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  currentStatus?: string;
  searchQuery?: string;
  direction?: string;
  dict?: Record<string, string>;
};

export function PluginTable({
  plugins = [],
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  currentStatus = "all",
  searchQuery = "",
  direction = "ltr",
  dict = {},
}: Props) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [notice, setNotice] = useState<{
    type?: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });
  const [isPending, startTransition] = useTransition();

  const allSelected = plugins.length > 0 && selectedSlugs.length === plugins.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedSlugs(checked ? plugins.map((p) => p.slug) : []);
  };

  const toggleSelectOne = (slug: string, checked: boolean) => {
    setSelectedSlugs((curr) =>
      checked ? [...new Set([...curr, slug])] : curr.filter((s) => s !== slug)
    );
  };

  const executeBulkDelete = () => {
    startTransition(async () => {
      try {
        await bulkPluginsAction(selectedSlugs, "delete");
        setNotice({
          type: "success",
          message: `${selectedSlugs.length} ${
            dict["admin.plugins.bulk.deleted_notice"] || "plugins deleted."
          }`,
        });
        setSelectedSlugs([]);
        setBulkAction("Bulk actions");
        router.refresh();
      } catch (err) {
        console.error("Failed to delete plugins:", err);
        setNotice({
          type: "error",
          message:
            dict["admin.plugins.bulk.failed_notice"] ||
            "Failed to execute bulk action.",
        });
      }
    });
  };

  const handleApplyBulkAction = () => {
    if (!selectedSlugs.length || bulkAction === "Bulk actions") return;

    if (bulkAction === "delete") {
      setConfirmDialog({
        open: true,
        title: dict["admin.plugins.bulk_delete_title"] || "Delete Plugins",
        description:
          dict["admin.plugins.bulk.delete_confirm"] ||
          "Are you sure you want to delete the selected plugins and their data?",
        action: executeBulkDelete,
      });
      return;
    }

    startTransition(async () => {
      try {
        if (bulkAction === "activate") {
          await bulkPluginsAction(selectedSlugs, "activate");
          setNotice({
            type: "success",
            message: `${selectedSlugs.length} ${
              dict["admin.plugins.bulk.activated_notice"] || "plugins activated."
            }`,
          });
        } else if (bulkAction === "deactivate") {
          await bulkPluginsAction(selectedSlugs, "deactivate");
          setNotice({
            type: "success",
            message: `${selectedSlugs.length} ${
              dict["admin.plugins.bulk.deactivated_notice"] ||
              "plugins deactivated."
            }`,
          });
        }

        setSelectedSlugs([]);
        setBulkAction("Bulk actions");
        router.refresh();
      } catch (err) {
        console.error("Failed to execute bulk action:", err);
        setNotice({
          type: "error",
          message:
            dict["admin.plugins.bulk.failed_notice"] ||
            "Failed to execute bulk action.",
        });
      }
    });
  };

  const handleToggleSingle = (slug: string, activate: boolean) => {
    startTransition(async () => {
      try {
        if (activate) {
          await activatePluginAction(slug);
          setNotice({
            type: "success",
            message: dict["admin.plugins.single_activated"] || "Plugin activated.",
          });
        } else {
          await deactivatePluginAction(slug);
          setNotice({
            type: "success",
            message: dict["admin.plugins.single_deactivated"] || "Plugin deactivated.",
          });
        }
        router.refresh();
      } catch (err) {
        console.error("Failed to toggle plugin:", err);
        setNotice({
          type: "error",
          message: dict["admin.plugins.single_failed"] || "Action failed.",
        });
      }
    });
  };

  const handleDeleteSingle = (slug: string) => {
    setConfirmDialog({
      open: true,
      title: dict["admin.plugins.delete_title"] || "Delete Plugin",
      description:
        dict["admin.plugins.single_delete_confirm"] ||
        "Are you sure you want to delete this plugin and its data?",
      action: () => {
        startTransition(async () => {
          try {
            await uninstallPluginAction(slug);
            setNotice({
              type: "success",
              message: dict["admin.plugins.single_deleted"] || "Plugin deleted.",
            });
            router.refresh();
          } catch (err) {
            console.error("Failed to delete plugin:", err);
            setNotice({
              type: "error",
              message: dict["admin.plugins.single_failed"] || "Delete failed.",
            });
          }
        });
      },
    });
  };

  const queryParams = new URLSearchParams();
  if (currentStatus && currentStatus !== "all") queryParams.set("status", currentStatus);
  if (searchQuery) queryParams.set("s", searchQuery);
  const queryString = queryParams.toString();

  return (
    <div className="space-y-3">
      {notice && (
        <div
          className={`flex items-center justify-between border-s-4 p-3 text-xs shadow-sm ${notice.type === "error"
            ? "border-[#d63638] bg-[#fcf0f1] text-[#d63638]"
            : notice.type === "warning"
              ? "border-[#dba617] bg-[#fcf9e8] text-[#614800]"
              : "border-[#00a32a] bg-[#edfaef] text-[#007017]"
            }`}
        >
          <span>{notice.message}</span>
          <button
            className="font-bold opacity-60 hover:opacity-100 cursor-pointer"
            onClick={() => setNotice(null)}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Tablenav */}
      <PluginTablenav
        bulkAction={bulkAction}
        currentPage={currentPage}
        dict={dict}
        isPending={isPending}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="top"
        queryString={queryString}
        totalItems={totalItems}
        totalPages={totalPages}
      />

      {/* Main Table */}
      <div className="border border-[#c3c4c7] bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-start text-xs text-[#2c3338] border-collapse">
          <thead>
            <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">
              <th className="w-8 px-3 py-2.5 text-center">
                <input
                  aria-label="Select all plugins"
                  checked={allSelected}
                  className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2.5 text-start font-semibold">
                {dict["admin.plugins.table.plugin"] || "Plugin"}
              </th>
              <th className="px-3 py-2.5 text-start font-semibold">
                {dict["admin.plugins.table.description"] || "Description"}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#dcdcde]">
            {plugins.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-[#646970]" colSpan={3}>
                  {dict["admin.plugins.no_plugins"] || "No plugins found."}
                </td>
              </tr>
            ) : (
              plugins.map((plugin) => {
                const isSelected = selectedSlugs.includes(plugin.slug);
                const isActive = !!plugin.isActive;

                return (
                  <tr
                    className={`transition-colors group ${isActive
                      ? "bg-[#f0f6fc] border-s-4 border-s-[#2271b1]"
                      : "hover:bg-[#f6f7f7] border-s-4 border-s-transparent"
                      }`}
                    key={plugin.slug}
                  >
                    <td className="px-3 py-3 text-center align-top">
                      <input
                        aria-label={`Select ${plugin.name}`}
                        checked={isSelected}
                        className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                        onChange={(e) => toggleSelectOne(plugin.slug, e.target.checked)}
                        type="checkbox"
                      />
                    </td>

                    <td className="px-3 py-3 align-top min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1d2327]">
                          {dict[`admin.plugins.catalog.${plugin.slug}.name`] || plugin.name}
                        </span>
                        <PluginStatusBadge dict={dict} isActive={isActive} />
                      </div>

                      {/* Row Actions */}
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[#8c8f94]">
                        {isActive ? (
                          <button
                            className="text-[#d63638] hover:underline cursor-pointer disabled:opacity-50"
                            disabled={isPending}
                            onClick={() => handleToggleSingle(plugin.slug, false)}
                            type="button"
                          >
                            {dict["admin.plugins.deactivate"] || "Deactivate"}
                          </button>
                        ) : (
                          <button
                            className="text-[#2271b1] hover:underline cursor-pointer disabled:opacity-50 font-medium"
                            disabled={isPending}
                            onClick={() => handleToggleSingle(plugin.slug, true)}
                            type="button"
                          >
                            {dict["admin.plugins.activate"] || "Activate"}
                          </button>
                        )}

                        {plugin.settingsUrl && (
                          <>
                            <span>|</span>
                            <Link
                              className="text-[#2271b1] hover:underline"
                              href={plugin.settingsUrl}
                            >
                              {dict["admin.plugins.settings"] || "Settings"}
                            </Link>
                          </>
                        )}

                        {!isActive && (
                          <>
                            <span>|</span>
                            <button
                              className="text-[#d63638] hover:underline cursor-pointer disabled:opacity-50"
                              disabled={isPending}
                              onClick={() => handleDeleteSingle(plugin.slug)}
                              type="button"
                            >
                              {dict["admin.plugins.delete"] || "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 align-top text-[#50575e]">
                      <p className="text-xs leading-relaxed text-[#2c3338] mb-1.5">
                        {dict[`admin.plugins.catalog.${plugin.slug}.desc`] || plugin.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#646970]">
                        <span>
                          {dict["admin.plugins.version"] || "Version"} {plugin.version}
                        </span>
                        <span>|</span>
                        <span>
                          {dict["admin.plugins.by"] || "By"}{" "}
                          {plugin.authorUrl ? (
                            <a
                              className="text-[#2271b1] hover:underline"
                              href={plugin.authorUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {dict[`admin.plugins.catalog.${plugin.slug}.author`] || plugin.author}
                            </a>
                          ) : (
                            dict[`admin.plugins.catalog.${plugin.slug}.author`] || plugin.author
                          )}
                        </span>
                        {plugin.pluginUrl && (
                          <>
                            <span>|</span>
                            <a
                              className="text-[#2271b1] hover:underline"
                              href={plugin.pluginUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {dict["admin.plugins.view_details"] || "View details"}
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr className="border-t border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">
              <th className="w-8 px-3 py-2.5 text-center">
                <input
                  aria-label="Select all plugins"
                  checked={allSelected}
                  className="rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2.5 text-start font-semibold">
                {dict["admin.plugins.table.plugin"] || "Plugin"}
              </th>
              <th className="px-3 py-2.5 text-start font-semibold">
                {dict["admin.plugins.table.description"] || "Description"}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <PluginTablenav
        bulkAction={bulkAction}
        currentPage={currentPage}
        dict={dict}
        isPending={isPending}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="bottom"
        queryString={queryString}
        totalItems={totalItems}
        totalPages={totalPages}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        direction={direction}
        dict={dict}
        confirmText={dict["admin.common.delete"] || "Delete"}
        cancelText={dict["admin.common.cancel"] || "Cancel"}
        onConfirm={confirmDialog.action}
        isLoading={isPending}
      />
    </div>
  );
}
