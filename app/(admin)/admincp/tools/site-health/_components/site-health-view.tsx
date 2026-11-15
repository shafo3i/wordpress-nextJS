"use client"

import { useState } from "react"
import {
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react"
import type { SiteHealthData } from "@/services/database-maintenance.service"
import { fetchSiteHealthAction, scanSiteStorageAction } from "../actions"

interface SiteHealthViewProps {
  data: SiteHealthData
  dict: Record<string, string>
}

export function SiteHealthView({
  data: initialData,
  dict,
}: SiteHealthViewProps) {
  const [data, setData] = useState<SiteHealthData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<"status" | "info">("status")
  const [openSections, setOpenSections] = useState<string[]>([
    "database",
    "server",
  ])

  const handleRefresh = async () => {
    setError(null)
    setIsRefreshing(true)
    try {
      const res = await fetchSiteHealthAction()
      if (res.success && res.data) {
        setData(res.data)
      } else {
        setError(res.error || dict["admin.tools.error.failed"])
      }
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleStorageScan = async () => {
    if (isScanning || isRefreshing) return
    setIsScanning(true)
    setError(null)
    try {
      const result = await scanSiteStorageAction()
      if (result.success && result.data) setData(result.data)
      else setError(result.error || dict["admin.tools.error.failed"])
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs & Refresh */}
      <div className="flex items-center justify-between gap-2 border-b border-[#c3c4c7]">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`-mb-[1px] cursor-pointer border-b-2 px-4 py-2 text-[13px] font-semibold transition-colors ${
              activeTab === "status"
                ? "border-[#2271b1] bg-white text-[#2271b1]"
                : "border-transparent text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            {dict["admin.tools.site_health_status"] || ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`-mb-[1px] cursor-pointer border-b-2 px-4 py-2 text-[13px] font-semibold transition-colors ${
              activeTab === "info"
                ? "border-[#2271b1] bg-white text-[#2271b1]"
                : "border-transparent text-[#50575e] hover:text-[#1d2327]"
            }`}
          >
            {dict["admin.tools.site_health_info"] || ""}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || isScanning}
          className="-mb-1 inline-flex cursor-pointer items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-[12px] font-medium text-[#2271b1] transition-colors hover:bg-[#f0f0f1] hover:text-[#135e96] disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing
            ? dict["admin.tools.refreshing"] || ""
            : dict["admin.tools.recheck_status"] || ""}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-[13px] text-[#d63638]">
          {error}
        </p>
      )}
      <p className="text-[13px] text-[#50575e]">
        {dict["admin.tools.health.scope"]}
      </p>
      {/* Tab: Status */}
      {activeTab === "status" && (
        <div className="space-y-4">
          {/* PostgreSQL Database Card */}
          <div className="flex items-start justify-between gap-4 rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded border border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]">
                <Database className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.db_status_title"] || ""}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#50575e]">
                  {dict["admin.tools.db_status_desc"] || ""} (
                  {data.database.totalTables} {dict["admin.tools.tables"] || ""}
                  , {data.database.size})
                </p>
              </div>
            </div>
            <span
              className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold ${data.database.status === "good" ? "border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]" : "border-[#f5c6cb] bg-[#fcf0f1] text-[#d63638]"}`}
            >
              {dict[
                data.database.status === "good"
                  ? "admin.tools.good"
                  : "admin.tools.warning"
              ] || ""}
            </span>
          </div>

          {/* Storage Directory Card */}
          <div className="flex items-start justify-between gap-4 rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex size-9 items-center justify-center rounded border ${
                  data.storage.writable
                    ? "border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]"
                    : "border-[#f5c6cb] bg-[#fcf0f1] text-[#d63638]"
                }`}
              >
                <HardDrive className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.storage_status_title"] || ""}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#50575e]">
                  {data.storage.writable
                    ? dict["admin.tools.storage_writable"] || ""
                    : dict["admin.tools.storage_not_writable"] || ""}{" "}
                  {data.storage.fileCount !== null && (
                    <>
                      ({data.storage.fileCount}{" "}
                      {dict["admin.tools.files"] || ""},{" "}
                      {data.storage.totalSize})
                    </>
                  )}
                </p>
                {data.storage.diskFree && data.storage.diskTotal && (
                  <p className="mt-1 text-[12px] text-[#646970]">
                    {dict["admin.tools.storage.capacity"]
                      .replace("{free}", data.storage.diskFree)
                      .replace("{total}", data.storage.diskTotal)}
                  </p>
                )}
                <p className="mt-1 text-[12px] text-[#646970]">
                  {data.storage.scannedAt
                    ? dict["admin.tools.storage.last_scan"].replace(
                        "{time}",
                        new Date(data.storage.scannedAt).toISOString()
                      )
                    : dict["admin.tools.storage.not_scanned"]}
                </p>
                <p className="mt-1 text-[12px] text-[#646970]">
                  {dict["admin.tools.storage.manual_hint"]}
                </p>
                <button
                  type="button"
                  onClick={handleStorageScan}
                  disabled={isScanning || isRefreshing}
                  className="mt-2 rounded border border-[#2271b1] bg-[#f6f7f7] px-3 py-1.5 text-[13px] text-[#2271b1] disabled:opacity-50"
                >
                  {
                    dict[
                      isScanning
                        ? "admin.tools.storage.scanning"
                        : "admin.tools.storage.scan"
                    ]
                  }
                </button>
              </div>
            </div>
            <span
              className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold ${
                data.storage.writable
                  ? "border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]"
                  : "border-[#f5c6cb] bg-[#fcf0f1] text-[#d63638]"
              }`}
            >
              {data.storage.writable
                ? dict["admin.tools.good"] || ""
                : dict["admin.tools.warning"] || ""}
            </span>
          </div>

          {/* Node.js Runtime Card */}
          <div className="flex items-start justify-between gap-4 rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded border border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]">
                <Server className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.node_status_title"] || ""}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#50575e]">
                  {dict["admin.tools.health.runtime_summary"]
                    .replace("{version}", data.server.nodeVersion)
                    .replace("{platform}", data.server.platform)
                    .replace("{arch}", data.server.arch)
                    .replace("{used}", data.server.memoryHeapUsed)
                    .replace("{total}", data.server.memoryHeapTotal)}
                </p>
              </div>
            </div>
            <span className="rounded border border-[#b2e2bd] bg-[#edfaef] px-2.5 py-0.5 text-[11px] font-semibold text-[#00a32a]">
              {dict["admin.tools.good"] || ""}
            </span>
          </div>

          {/* Security Card */}
          <div className="flex items-start justify-between gap-4 rounded-[3px] border border-[#dcdcde] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded border border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.tools.security_status_title"] || ""}
                </h3>
                <p className="mt-0.5 text-[13px] text-[#50575e]">
                  {dict["admin.tools.health.env_summary"]
                    .replace(
                      "{configured}",
                      dict[
                        data.security.envConfigured
                          ? "admin.tools.yes"
                          : "admin.tools.no"
                      ]
                    )
                    .replace("{mode}", data.security.nodeEnv)}
                  <br />
                  {dict["admin.tools.health.https"]}:{" "}
                  {
                    dict[
                      data.security.https ? "admin.tools.yes" : "admin.tools.no"
                    ]
                  }
                  <br />
                  {dict["admin.tools.health.db_ssl"]}:{" "}
                  {
                    dict[
                      data.security.dbSsl ? "admin.tools.yes" : "admin.tools.no"
                    ]
                  }
                </p>
              </div>
            </div>
            <span
              className={`rounded border px-2.5 py-0.5 text-[11px] font-semibold ${data.security.envConfigured && data.security.https ? "border-[#b2e2bd] bg-[#edfaef] text-[#00a32a]" : "border-[#f5c6cb] bg-[#fcf0f1] text-[#d63638]"}`}
            >
              {dict[
                data.security.envConfigured && data.security.https
                  ? "admin.tools.good"
                  : "admin.tools.warning"
              ] || ""}
            </span>
          </div>
        </div>
      )}

      {/* Tab: Info (System Technical Accordion) */}
      {activeTab === "info" && (
        <div className="space-y-3">
          {/* Database Section */}
          <div className="overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => toggleSection("database")}
              className="flex w-full cursor-pointer items-center justify-between bg-[#f6f7f7] p-3.5 text-start text-[13px] font-semibold text-[#1d2327] hover:bg-[#f0f0f1]"
            >
              <span>{dict["admin.tools.info_database"] || ""}</span>
              {openSections.includes("database") ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {openSections.includes("database") && (
              <div className="divide-y divide-[#f0f0f1] p-4 text-[13px]">
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.db_version"] || ""}
                  </span>
                  <span className="max-w-md truncate font-mono text-[#1d2327]">
                    {data.database.version}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.db_size"] || ""}
                  </span>
                  <span className="font-semibold text-[#1d2327]">
                    {data.database.size}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.db_tables"] || ""}
                  </span>
                  <span className="text-[#1d2327]">
                    {data.database.totalTables}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.db_connections"] || ""}
                  </span>
                  <span className="text-[#1d2327]">
                    {data.database.activeConnections}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.db_server_time"] || ""}
                  </span>
                  <span className="font-mono text-[#1d2327]">
                    {data.database.serverTime}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Server Section */}
          <div className="overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => toggleSection("server")}
              className="flex w-full cursor-pointer items-center justify-between bg-[#f6f7f7] p-3.5 text-start text-[13px] font-semibold text-[#1d2327] hover:bg-[#f0f0f1]"
            >
              <span>{dict["admin.tools.info_server"] || ""}</span>
              {openSections.includes("server") ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {openSections.includes("server") && (
              <div className="divide-y divide-[#f0f0f1] p-4 text-[13px]">
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.health.node"]}
                  </span>
                  <span className="font-mono text-[#1d2327]">
                    {data.server.nodeVersion}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.health.platform"]}
                  </span>
                  <span className="font-mono text-[#1d2327]">
                    {data.server.platform} ({data.server.arch})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.health.uptime"]}
                  </span>
                  <span className="text-[#1d2327]">{data.server.uptime}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.health.heap"]}
                  </span>
                  <span className="font-mono text-[#1d2327]">
                    {data.server.memoryHeapUsed} / {data.server.memoryHeapTotal}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#646970]">
                    {dict["admin.tools.health.rss"]}
                  </span>
                  <span className="font-mono text-[#1d2327]">
                    {data.server.memoryRss}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
