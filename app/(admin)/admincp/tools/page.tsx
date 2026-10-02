import Link from "next/link";
import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { Download, Upload, Database, FileCode, Archive, ArrowRight, Search, Trash2, Activity, Link as LinkIcon, Globe, Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  await verifyAdminOrEditor();

  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const toolsList = [
    {
      id: "export",
      icon: Download,
      title: dict["admin.tools.export_title"] || "Export Content & Backups",
      tag: "WXR 1.2 XML / SQL / JSON",
      description:
        dict["admin.tools.export_desc"] ||
        "Export posts, pages, comments, categories, tags, or a raw PostgreSQL database dump to migrate to another WordPress site or preserve backups.",
      actionLabel: dict["admin.tools.go_to_export"] || "Open Export Tool",
      href: "/admincp/tools/export",
      primary: true,
    },
    {
      id: "import",
      icon: Upload,
      title: dict["admin.tools.import_title"] || "Import Content",
      tag: "WXR XML / JSON",
      description:
        dict["admin.tools.import_desc"] ||
        "Migrate articles, pages, categories, tags, and comments from an existing WordPress site or PressForge backup directly into your database.",
      actionLabel: dict["admin.tools.go_to_import"] || "Open Import Tool",
      href: "/admincp/tools/import",
      primary: false,
    },
    {
      id: "search_replace",
      icon: Search,
      title: dict["admin.tools.search_replace"] || "Search & Replace",
      tag: "Database URL / String Tool",
      description:
        dict["admin.tools.search_replace_desc"] ||
        "Safely scan and replace URLs, domain names, or text strings across your database. Safely deserializes JSON columns without corrupting structure.",
      actionLabel: dict["admin.tools.go_to_search_replace"] || "Open Search & Replace",
      href: "/admincp/tools/search-replace",
      primary: false,
    },
    {
      id: "cleanup",
      icon: Trash2,
      title: dict["admin.tools.cleanup_title"] || "Database Cleanup & Optimization",
      tag: "Maintenance & Vacuum",
      description:
        dict["admin.tools.cleanup_subtitle"] ||
        "Delete accumulated database bloat, orphaned entries, and reclaim disk space with PostgreSQL VACUUM.",
      actionLabel: dict["admin.tools.go_to_cleanup"] || "Open Cleanup Tool",
      href: "/admincp/tools/cleanup",
      primary: false,
    },
    {
      id: "site_health",
      icon: Activity,
      title: dict["admin.tools.site_health"] || "Site Health",
      tag: "Diagnostics & Performance",
      description:
        dict["admin.tools.site_health_desc"] ||
        "Check the health and performance status of your database, server, storage, and security.",
      actionLabel: dict["admin.tools.go_to_site_health"] || "View Site Health",
      href: "/admincp/tools/site-health",
      primary: false,
    },
    {
      id: "redirects",
      icon: LinkIcon,
      title: dict["admin.tools.redirects_title"] || "301 Redirects Manager",
      tag: "URL Management & 404 Prevention",
      description:
        dict["admin.tools.redirects_subtitle"] ||
        "Manage permanent (301) and temporary (302) URL redirects to protect search rankings and fix broken links.",
      actionLabel: dict["admin.tools.go_to_redirects"] || "Manage Redirects",
      href: "/admincp/tools/redirects",
      primary: false,
    },
    {
      id: "seo_feeds",
      icon: Globe,
      title: dict["admin.tools.seo_feeds"] || "SEO, Sitemaps & RSS Feeds",
      tag: "Google News & Syndication",
      description:
        dict["admin.tools.seo_feeds_subtitle"] ||
        "Live syndication feeds, Google News protocols, and XML sitemaps.",
      actionLabel: dict["admin.tools.go_to_seo_feeds"] || "View Feeds & Sitemaps",
      href: "/admincp/tools/seo-feeds",
      primary: false,
    },
    {
      id: "media_tools",
      icon: ImageIcon,
      title: dict["admin.tools.media_title"] || "Media Utilities & Maintenance",
      tag: "Sharp WebP & Orphan Cleaner",
      description:
        dict["admin.tools.media_desc"] ||
        "Batch thumbnail regeneration, WebP compression, and orphan media storage cleanup.",
      actionLabel: dict["admin.tools.go_to_media"] || "Manage Media Utilities",
      href: "/admincp/tools/media",
      primary: false,
    },
    {
      id: "sql_backup",
      icon: Database,
      title: dict["admin.tools.format_sql"] || "PostgreSQL Dump (.sql)",
      tag: "PostgreSQL DDL & Data",
      description:
        dict["admin.tools.sql_notice_desc"] ||
        "The SQL export includes table data for wp_posts, wp_postmeta, wp_terms, wp_term_taxonomy, wp_comments, and wp_options formatted with valid PostgreSQL INSERT statements.",
      actionLabel: dict["admin.tools.download_sql"] || "Download SQL Dump",
      href: "/api/admin/tools/export?format=sql",
      isDirectDownload: true,
      primary: false,
    },
    {
      id: "json_archive",
      icon: Archive,
      title: dict["admin.tools.format_json"] || "JSON Archive (.json)",
      tag: "Structured JSON",
      description:
        dict["admin.tools.format_json_desc"] ||
        "Structured JSON schema for developers, backups, and programmatic API migrations.",
      actionLabel: dict["admin.tools.download_json"] || "Download JSON Archive",
      href: "/api/admin/tools/export?format=json",
      isDirectDownload: true,
      primary: false,
    },
  ];

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <div>
            <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
              {dict["admin.tools.title"] || "Tools"}
            </h1>
            <p className="text-[13px] text-[#50575e] mt-0.5">
              {dict["admin.tools.subtitle"] ||
                "System utilities, data portability, database backups, and content migration."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admincp/tools/export"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 py-1 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors"
            >
              <Download className="size-3.5" />
              {dict["admin.tools.export"] || "Export"}
            </Link>
            <Link
              href="/admincp/tools/import"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1 text-[13px] font-medium text-[#2c3338] hover:border-[#8c8f94] transition-colors"
            >
              <Upload className="size-3.5" />
              {dict["admin.tools.import"] || "Import"}
            </Link>
          </div>
        </div>

        {/* Tools List Table */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-2.5 text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.menu.available_tools"] || "Available Tools"}
          </div>

          <div className="divide-y divide-[#f0f0f1]">
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#f6f7f7]/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#f0f0f1] text-[#2271b1] border border-[#c3c4c7]/40 mt-0.5">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[14px] font-semibold text-[#1d2327]">
                          {tool.title}
                        </h2>
                        <span className="rounded bg-[#f0f0f1] px-1.5 py-0.5 text-[10px] font-medium text-[#50575e] border border-[#dcdcde]">
                          {tool.tag}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#50575e] mt-1 leading-relaxed max-w-3xl">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-end sm:self-center">
                    {tool.isDirectDownload ? (
                      <a
                        href={tool.href}
                        download
                        className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3.5 py-1.5 text-[13px] font-medium text-[#2271b1] hover:text-[#0a4b78] transition-colors"
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
                            : "border border-[#c3c4c7] bg-white hover:bg-[#f6f7f7] text-[#2c3338] hover:border-[#8c8f94]"
                        }`}
                      >
                        {tool.actionLabel}
                        <ArrowRight className="size-3 rtl:rotate-180" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
