import Link from "next/link"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  Download,
  Upload,
  Database,
  Archive,
  ArrowRight,
  Search,
  Trash2,
  Activity,
  Link as LinkIcon,
  Globe,
  Image as ImageIcon,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ToolsPage() {
  await verifyAdmin()

  const langContext = await getAdminLanguageContext()
  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

  const toolsList = [
    {
      id: "export",
      icon: Download,
      title: dict["admin.tools.content_export.title"] || "",
      tag: dict["admin.tools.tag.export"],
      description: dict["admin.tools.content_export.description"] || "",
      actionLabel: dict["admin.tools.go_to_export"] || "",
      href: "/admincp/tools/export",
      primary: true,
    },
    {
      id: "import",
      icon: Upload,
      title: dict["admin.tools.import_title"] || "",
      tag: dict["admin.tools.tag.import"],
      description: dict["admin.tools.content_import.description"] || "",
      actionLabel: dict["admin.tools.go_to_import"] || "",
      href: "/admincp/tools/import",
      primary: false,
    },
    {
      id: "search_replace",
      icon: Search,
      title: dict["admin.tools.search_replace"] || "",
      tag: dict["admin.tools.tag.search_replace"],
      description: dict["admin.tools.search_replace_desc"] || "",
      actionLabel: dict["admin.tools.go_to_search_replace"] || "",
      href: "/admincp/tools/search-replace",
      primary: false,
    },
    {
      id: "cleanup",
      icon: Trash2,
      title: dict["admin.tools.cleanup_title"] || "",
      tag: dict["admin.tools.tag.cleanup"],
      description: dict["admin.tools.cleanup_subtitle"] || "",
      actionLabel: dict["admin.tools.go_to_cleanup"] || "",
      href: "/admincp/tools/cleanup",
      primary: false,
    },
    {
      id: "site_health",
      icon: Activity,
      title: dict["admin.tools.site_health"] || "",
      tag: dict["admin.tools.tag.site_health"],
      description: dict["admin.tools.site_health_desc"] || "",
      actionLabel: dict["admin.tools.go_to_site_health"] || "",
      href: "/admincp/tools/site-health",
      primary: false,
    },
    {
      id: "redirects",
      icon: LinkIcon,
      title: dict["admin.tools.redirects_title"] || "",
      tag: dict["admin.tools.tag.redirects"],
      description: dict["admin.tools.redirects_subtitle"] || "",
      actionLabel: dict["admin.tools.go_to_redirects"] || "",
      href: "/admincp/tools/redirects",
      primary: false,
    },
    {
      id: "seo_feeds",
      icon: Globe,
      title: dict["admin.tools.seo_feeds"] || "",
      tag: dict["admin.tools.tag.seo_feeds"],
      description: dict["admin.tools.seo_feeds_subtitle"] || "",
      actionLabel: dict["admin.tools.go_to_seo_feeds"] || "",
      href: "/admincp/tools/seo-feeds",
      primary: false,
    },
    {
      id: "media_tools",
      icon: ImageIcon,
      title: dict["admin.tools.media_title"] || "",
      tag: dict["admin.tools.tag.media_tools"],
      description: dict["admin.tools.media_desc"] || "",
      actionLabel: dict["admin.tools.go_to_media"] || "",
      href: "/admincp/tools/media",
      primary: false,
    },
    {
      id: "sql_backup",
      icon: Database,
      title: dict["admin.tools.content_export.sql_title"] || "",
      tag: dict["admin.tools.tag.sql_backup"],
      description: dict["admin.tools.content_export.sql_notice_description"] || "",
      actionLabel: dict["admin.tools.download_sql"] || "",
      href: "/api/admin/tools/export?format=sql",
      isDirectDownload: true,
      primary: false,
    },
    {
      id: "json_archive",
      icon: Archive,
      title: dict["admin.tools.format_json"] || "",
      tag: dict["admin.tools.tag.json_archive"],
      description: dict["admin.tools.content_export.json_description"] || "",
      actionLabel: dict["admin.tools.download_json"] || "",
      href: "/api/admin/tools/export?format=json",
      isDirectDownload: true,
      primary: false,
    },
  ]

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <div>
            <h1 className="text-[23px] leading-normal font-normal text-[#1d2327]">
              {dict["admin.tools.title"] || ""}
            </h1>
            <p className="mt-0.5 text-[13px] text-[#50575e]">
              {dict["admin.tools.subtitle"] || ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admincp/tools/export"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-[#135e96]"
            >
              <Download className="size-3.5" />
              {dict["admin.tools.export"] || ""}
            </Link>
            <Link
              href="/admincp/tools/import"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1 text-[13px] font-medium text-[#2c3338] transition-colors hover:border-[#8c8f94]"
            >
              <Upload className="size-3.5" />
              {dict["admin.tools.import"] || ""}
            </Link>
          </div>
        </div>

        {/* Tools List Table */}
        <div className="overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-2.5 text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.menu.available_tools"] || ""}
          </div>

          <div className="divide-y divide-[#f0f0f1]">
            {toolsList.map((tool) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.id}
                  className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-[#f6f7f7]/60 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="mt-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded border border-[#c3c4c7]/40 bg-[#f0f0f1] text-[#2271b1]">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[14px] font-semibold text-[#1d2327]">
                          {tool.title}
                        </h2>
                        <span className="rounded border border-[#dcdcde] bg-[#f0f0f1] px-1.5 py-0.5 text-[10px] font-medium text-[#50575e]">
                          {tool.tag}
                        </span>
                      </div>
                      <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#50575e]">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-end sm:self-center">
                    {tool.isDirectDownload ? (
                      <a
                        href={tool.href}
                        download
                        className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3.5 py-1.5 text-[13px] font-medium text-[#2271b1] transition-colors hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
                      >
                        <Download className="size-3.5" />
                        {tool.actionLabel}
                      </a>
                    ) : (
                      <Link
                        href={tool.href}
                        className={`inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                          tool.primary
                            ? "border border-[#2271b1] bg-[#2271b1] text-white hover:bg-[#135e96]"
                            : "border border-[#c3c4c7] bg-white text-[#2c3338] hover:border-[#8c8f94] hover:bg-[#f6f7f7]"
                        }`}
                      >
                        {tool.actionLabel}
                        <ArrowRight className="size-3 rtl:rotate-180" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
