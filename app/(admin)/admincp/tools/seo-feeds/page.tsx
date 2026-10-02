import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getSitemapStats } from "@/services/sitemap.service";
import Link from "next/link";
import { Globe, Rss, Newspaper, ExternalLink, CheckCircle, Copy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SeoFeedsPage() {
  await verifyAdminOrEditor();

  const [langContext, stats] = await Promise.all([
    getAdminLanguageContext(),
    getSitemapStats(),
  ]);

  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const feeds = [
    {
      id: "news_sitemap",
      icon: Newspaper,
      title: dict["admin.tools.news_sitemap_title"] || "Google News XML Sitemap",
      url: "/news-sitemap.xml",
      badge: "Google News Protocol",
      desc:
        dict["admin.tools.news_sitemap_desc"] ||
        "Specially formatted for Google News crawlers with publication name, article language, and 48-hour freshness rules.",
      format: "XML / Google News 0.9",
    },
    {
      id: "standard_sitemap",
      icon: Globe,
      title: dict["admin.tools.standard_sitemap_title"] || "Standard XML Sitemap",
      url: "/sitemap.xml",
      badge: `${stats.totalUrls} ${dict["admin.tools.urls_indexed"] || "URLs Indexed"}`,
      desc:
        dict["admin.tools.standard_sitemap_desc"] ||
        "Complete index of all published news stories, standalone pages, and topic categories for Google, Bing, and search engines.",
      format: "XML / Sitemaps.org 0.9",
    },
    {
      id: "main_rss",
      icon: Rss,
      title: dict["admin.tools.main_rss_title"] || "Main RSS 2.0 Syndication Feed",
      url: "/feed",
      badge: "RSS 2.0",
      desc:
        dict["admin.tools.main_rss_desc"] ||
        "Syndicates the latest 25 published investigative reports and news stories for RSS readers, Apple News, and feed aggregators.",
      format: "RSS 2.0 with CDATA & Enclosures",
    },
  ];

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
                {dict["admin.tools.title"] || "Tools"}
              </Link>
              <span className="text-[#646970]">/</span>
              <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
                {dict["admin.tools.seo_feeds"] || "SEO, Sitemaps & RSS Feeds"}
              </h1>
            </div>
            <p className="text-[13px] text-[#50575e] mt-0.5">
              {dict["admin.tools.seo_feeds_subtitle"] ||
                "Live syndication feeds, Google News protocols, and XML sitemaps."}
            </p>
          </div>
        </div>

        {/* Feeds List Table */}
        <div className="rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="border-b border-[#c3c4c7] bg-[#f6f7f7] px-4 py-2.5 text-[13px] font-semibold text-[#1d2327]">
            {dict["admin.tools.live_endpoints"] || "Live Syndication & Sitemap Endpoints"}
          </div>

          <div className="divide-y divide-[#f0f0f1]">
            {feeds.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#f6f7f7]/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex size-9 flex-shrink-0 items-center justify-center rounded bg-[#f0f0f1] text-[#2271b1] border border-[#c3c4c7]/40 mt-0.5">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[14px] font-semibold text-[#1d2327]">
                          {item.title}
                        </h2>
                        <span className="rounded bg-[#f0f6fc] px-2 py-0.5 text-[11px] font-medium text-[#2271b1] border border-[#c5d9ed]">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#50575e] mt-1 leading-relaxed max-w-3xl">
                        {item.desc}
                      </p>
                      <span className="inline-block mt-1 font-mono text-[12px] text-[#2271b1]">
                        {item.url}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-end sm:self-center">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] hover:bg-[#135e96] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors"
                    >
                      <ExternalLink className="size-3.5" />
                      {dict["admin.tools.open_endpoint"] || "View Live Endpoint"}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Google News Publishing Info Card */}
        <div className="rounded-[3px] border border-[#dcdcde] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-3">
          <h3 className="text-[14px] font-semibold text-[#1d2327]">
            {dict["admin.tools.google_news_guide_title"] || "Google Publisher Center & News Indexing Guidelines"}
          </h3>
          <ul className="space-y-2 text-[13px] text-[#50575e]">
            <li className="flex items-start gap-2">
              <span className="text-[#2271b1] font-bold">•</span>
              <span>
                {dict["admin.tools.google_news_tip_1"] ||
                  "Submit your news sitemap directly in Google Search Console under Sitemaps using the path '/news-sitemap.xml'."}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2271b1] font-bold">•</span>
              <span>
                {dict["admin.tools.google_news_tip_2"] ||
                  "Ensure your site name in Settings matches your publication name in Google Publisher Center."}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#2271b1] font-bold">•</span>
              <span>
                {dict["admin.tools.google_news_tip_3"] ||
                  "RSS Feeds update in real time with full article content, enabling automated syndication to Apple News, Google News Producer, and Flipboard."}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
