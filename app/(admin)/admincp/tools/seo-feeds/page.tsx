import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { getSitemapStats } from "@/services/sitemap.service"
import Link from "next/link"
import { Globe, Rss, Newspaper, ExternalLink } from "lucide-react"
export const dynamic = "force-dynamic"

export default async function SeoFeedsPage() {
  await verifyAdmin()

  const [langContext, stats] = await Promise.all([
    getAdminLanguageContext(),
    getSitemapStats(),
  ])

  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

  const feeds = [
    {
      id: "news_sitemap",
      icon: Newspaper,
      title: dict["admin.tools.news_sitemap_title"] || "",
      url: "/news-sitemap.xml",
      badge: "Google News Protocol",
      desc: dict["admin.tools.news_sitemap_desc"] || "",
      format: "XML / Google News 0.9",
    },
    {
      id: "standard_sitemap",
      icon: Globe,
      title: dict["admin.tools.standard_sitemap_title"] || "",
      url: "/sitemap.xml",
      badge: `${stats.totalUrls} ${dict["admin.tools.urls_indexed"]}`,
      desc: dict["admin.tools.standard_sitemap_desc"] || "",
      format: "XML / Sitemaps.org 0.9",
    },
    {
      id: "main_rss",
      icon: Rss,
      title: dict["admin.tools.main_rss_title"] || "",
      url: "/feed",
      badge: "RSS 2.0",
      desc: dict["admin.tools.main_rss_desc"] || "",
      format: "RSS 2.0 with CDATA & Enclosures",
    },
  ]

  return (
    <AdminShell>
      <div dir={direction} className="space-y-6 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admincp/tools"
                className="text-[13px] text-[#2271b1] hover:underline"
              >
                {dict["admin.tools.title"] || ""}
              </Link>
              <span className="text-[#646970]">/</span>
              <h1 className="text-[23px] leading-normal font-normal text-[#1d2327]">
                {dict["admin.tools.seo_feeds"] || ""}
              </h1>
            </div>
            <p className="mt-0.5 text-[13px] text-[#50575e]">
              {dict["admin.tools.seo_feeds_subtitle"] || ""}
            </p>
          </div>
        </div>

        {/* Feeds List Table */}
        <p className="text-[13px] text-[#50575e]">
          {dict["admin.tools.sitemap_discovery_note"]}
        </p>
        <div className="overflow-hidden rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-2.5 text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.tools.live_endpoints"] || ""}
          </div>

          <div className="divide-y divide-[#f0f0f1]">
            {feeds.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-[#f6f7f7]/60 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div className="mt-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded border border-[#c3c4c7]/40 bg-[#f0f0f1] text-[#2271b1]">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[14px] font-semibold text-[#1d2327]">
                          {item.title}
                        </h2>
                        <span className="rounded border border-[#c5d9ed] bg-[#f0f6fc] px-2 py-0.5 text-[11px] font-medium text-[#2271b1]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#50575e]">
                        {item.desc}
                      </p>
                      <span className="mt-1 inline-block font-mono text-[12px] text-[#2271b1]">
                        {item.url}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-end sm:self-center">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#135e96]"
                    >
                      <ExternalLink className="size-3.5" />
                      {dict["admin.tools.open_endpoint"] || ""}
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Google News Publishing Info Card */}
        <div className="space-y-3 rounded-[3px] border border-[#dcdcde] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.tools.google_news_guide_title"] || ""}
          </h3>
          <ul className="space-y-2 text-[13px] text-[#50575e]">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#2271b1]">•</span>
              <span>{dict["admin.tools.google_news_tip_1"] || ""}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#2271b1]">•</span>
              <span>{dict["admin.tools.google_news_tip_2"] || ""}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#2271b1]">•</span>
              <span>{dict["admin.tools.google_news_tip_3"] || ""}</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminShell>
  )
}
