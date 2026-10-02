"use client";

import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import type { SiteHealthData } from "@/services/database-maintenance.service";
import { fetchSiteHealthAction } from "../actions";

interface SiteHealthViewProps {
  data: SiteHealthData;
  dict: Record<string, string>;
}

export function SiteHealthView({ data: initialData, dict }: SiteHealthViewProps) {
  const [data, setData] = useState<SiteHealthData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "info">("status");
  const [openSections, setOpenSections] = useState<string[]>([
    "database",
    "server",
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchSiteHealthAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs & Refresh */}
      <div className="border-b border-[#c3c4c7] flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
              activeTab === "status"
                ? "border-[#2271b1] text-[#2271b1] bg-white"
                : "border-transparent text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            {dict["admin.tools.site_health_status"] || "Status"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
              activeTab === "info"
                ? "border-[#2271b1] text-[#2271b1] bg-white"
                : "border-transparent text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            {dict["admin.tools.site_health_info"] || "Info"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#2271b1] hover:text-[#135e96] hover:bg-[#f0f0f1] rounded border border-transparent transition-colors cursor-pointer disabled:opacity-50 -mb-1"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? (dict["admin.tools.refreshing"] || "Refreshing...") : (dict["admin.tools.recheck_status"] || "Re-check Status")}
        </button>
      </div>

      {/* Tab: Status */}
      {activeTab === "status" && (
        <div className="space-y-4">
          {/* PostgreSQL Database Card */}
          <div className="rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded bg-[#edfaef] text-[#00a32a] border border-[#b2e2bd] mt-0.5">
                <Database className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.db_status_title"] || "PostgreSQL Database Engine"}
                </h3>
                <p className="text-[13px] text-[#50575e] mt-0.5">
                  {dict["admin.tools.db_status_desc"] || "Database is connected and operational."}
                  {" "}({data.database.totalTables} {dict["admin.tools.tables"] || "tables"}, {data.database.size})
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#00a32a] bg-[#edfaef] border border-[#b2e2bd] px-2.5 py-0.5 rounded">
              {dict["admin.tools.good"] || "Good"}
            </span>
          </div>

          {/* Storage Directory Card */}
          <div className="rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex size-9 items-center justify-center rounded border mt-0.5 ${
                  data.storage.writable
                    ? "bg-[#edfaef] text-[#00a32a] border-[#b2e2bd]"
                    : "bg-[#fcf0f1] text-[#d63638] border-[#f5c6cb]"
                }`}
              >
                <HardDrive className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.storage_status_title"] || "Uploads Storage Directory"}
                </h3>
                <p className="text-[13px] text-[#50575e] mt-0.5">
                  {data.storage.writable
                    ? (dict["admin.tools.storage_writable"] || "The uploads directory is writable.")
                    : (dict["admin.tools.storage_not_writable"] || "Warning: Uploads directory is not writable.")}
                  {" "}({data.storage.fileCount} {dict["admin.tools.files"] || "files"}, {data.storage.totalSize})
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                data.storage.writable
                  ? "text-[#00a32a] bg-[#edfaef] border-[#b2e2bd]"
                  : "text-[#d63638] bg-[#fcf0f1] border-[#f5c6cb]"
              }`}
            >
              {data.storage.writable ? (dict["admin.tools.good"] || "Good") : (dict["admin.tools.warning"] || "Warning")}
            </span>
          </div>

          {/* Node.js Runtime Card */}
          <div className="rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded bg-[#edfaef] text-[#00a32a] border border-[#b2e2bd] mt-0.5">
                <Server className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.node_status_title"] || "Node.js Runtime & Memory"}
                </h3>
                <p className="text-[13px] text-[#50575e] mt-0.5">
                  Node.js {data.server.nodeVersion} on {data.server.platform} ({data.server.arch}). Memory: {data.server.memoryHeapUsed} / {data.server.memoryHeapTotal} heap.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#00a32a] bg-[#edfaef] border border-[#b2e2bd] px-2.5 py-0.5 rounded">
              {dict["admin.tools.good"] || "Good"}
            </span>
          </div>

          {/* Security Card */}
          <div className="rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded bg-[#edfaef] text-[#00a32a] border border-[#b2e2bd] mt-0.5">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.security_status_title"] || "Security & Configuration"}
                </h3>
                <p className="text-[13px] text-[#50575e] mt-0.5">
                  Environment variables configured: {data.security.envConfigured ? "Yes" : "No"}. Running in {data.security.nodeEnv} mode.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#00a32a] bg-[#edfaef] border border-[#b2e2bd] px-2.5 py-0.5 rounded">
              {dict["admin.tools.good"] || "Good"}
            </span>
          </div>
        </div>
      )}

      {/* Tab: Info (System Technical Accordion) */}
      {activeTab === "info" && (
        <div className="space-y-3">
          {/* Database Section */}
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("database")}
              className="w-full flex items-center justify-between p-3.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] text-start font-semibold text-[13px] text-[#1d2327] cursor-pointer"
            >
              <span>{dict["admin.tools.info_database"] || "Database (PostgreSQL)"}</span>
              {openSections.includes("database") ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openSections.includes("database") && (
              <div className="p-4 divide-y divide-[#f0f0f1] text-[13px]">
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">{dict["admin.tools.db_version"] || "Version"}</span>
                  <span className="font-mono text-[#1d2327] max-w-md truncate">{data.database.version}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">{dict["admin.tools.db_size"] || "Database Size"}</span>
                  <span className="font-semibold text-[#1d2327]">{data.database.size}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">{dict["admin.tools.db_tables"] || "Total Tables"}</span>
                  <span className="text-[#1d2327]">{data.database.totalTables}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">{dict["admin.tools.db_connections"] || "Active Connections"}</span>
                  <span className="text-[#1d2327]">{data.database.activeConnections}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">{dict["admin.tools.db_server_time"] || "Server Time"}</span>
                  <span className="font-mono text-[#1d2327]">{data.database.serverTime}</span>
                </div>
              </div>
            )}
          </div>

          {/* Server Section */}
          <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("server")}
              className="w-full flex items-center justify-between p-3.5 bg-[#f6f7f7] hover:bg-[#f0f0f1] text-start font-semibold text-[13px] text-[#1d2327] cursor-pointer"
            >
              <span>{dict["admin.tools.info_server"] || "Server Architecture"}</span>
              {openSections.includes("server") ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {openSections.includes("server") && (
              <div className="p-4 divide-y divide-[#f0f0f1] text-[13px]">
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">Node.js Version</span>
                  <span className="font-mono text-[#1d2327]">{data.server.nodeVersion}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">OS Platform / Arch</span>
                  <span className="font-mono text-[#1d2327]">{data.server.platform} ({data.server.arch})</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">Process Uptime</span>
                  <span className="text-[#1d2327]">{data.server.uptime}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">Heap Used / Total</span>
                  <span className="font-mono text-[#1d2327]">{data.server.memoryHeapUsed} / {data.server.memoryHeapTotal}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#646970]">RSS Memory</span>
                  <span className="font-mono text-[#1d2327]">{data.server.memoryRss}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
