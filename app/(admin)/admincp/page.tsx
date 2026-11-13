import Link from "next/link";
import { verifyAdmin } from "@/lib/authMIddleware";
import { getDashboardData } from "./query";
import {
  AdminShell,
  DashboardPanel,
  getAdminContext,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell";
import { WelcomePanel } from "./_components/welcome-panel";
import { QuickDraftWidget } from "./_components/quick-draft-widget";
import {
  FileText,
  FilePlus,
  Image as ImageIcon,
  MessageSquare,
  FolderTree,
  Tags,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Palette,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await verifyAdmin();
  const [data, context, langContext] = await Promise.all([
    getDashboardData(),
    getAdminContext(),
    getAdminLanguageContext(),
  ]);

  const { counts, recentPosts, recentDrafts, recentComments, healthData } =
    data;
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr";

  const runningInfoText = dict["admin.dashboard.running_info"].replace(
    "{theme}",
    context.themeName || dict["admin.dashboard.default_theme"]
  );

  return (
    <AdminShell>
      <div dir={direction} className="space-y-6 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#646970] uppercase">
              {dict["admin.dashboard.administration"]}
            </p>
            <h1 className="mt-0.5 text-[23px] leading-normal font-normal text-[#1d2327]">
              {dict["admin.dashboard.title"]}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#646970]">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#dcdcde] bg-white px-3 py-1 text-[#2271b1] transition-colors hover:bg-[#f0f0f1]"
            >
              <span>{context.siteName || "—"}</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {/* Authentic WordPress Welcome Panel (No demo banner!) */}
        <WelcomePanel dict={dict} siteName={context.siteName} />

        {/* Dashboard 2-Column Grid */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,1fr)]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* At a Glance Panel */}
            <DashboardPanel title={dict["admin.dashboard.at_a_glance"]}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {/* Posts */}
                <Link
                  href="/admincp/posts"
                  className="group flex items-center gap-3 rounded p-2 transition-colors hover:bg-[#f6f7f7]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] transition-colors group-hover:bg-[#2271b1] group-hover:text-white">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] leading-tight font-semibold text-[#1d2327]">
                      {counts.posts}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.posts_count"]}
                    </span>
                  </div>
                </Link>

                {/* Pages */}
                <Link
                  href="/admincp/pages"
                  className="group flex items-center gap-3 rounded p-2 transition-colors hover:bg-[#f6f7f7]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] transition-colors group-hover:bg-[#2271b1] group-hover:text-white">
                    <FilePlus className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] leading-tight font-semibold text-[#1d2327]">
                      {counts.pages}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.pages_count"]}
                    </span>
                  </div>
                </Link>

                {/* Media */}
                <Link
                  href="/admincp/media"
                  className="group flex items-center gap-3 rounded p-2 transition-colors hover:bg-[#f6f7f7]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] transition-colors group-hover:bg-[#2271b1] group-hover:text-white">
                    <ImageIcon className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] leading-tight font-semibold text-[#1d2327]">
                      {counts.media}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.media_count"]}
                    </span>
                  </div>
                </Link>

                {/* Comments */}
                <Link
                  href="/admincp/comments"
                  className="group flex items-center gap-3 rounded p-2 transition-colors hover:bg-[#f6f7f7]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] transition-colors group-hover:bg-[#2271b1] group-hover:text-white">
                    <MessageSquare className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[19px] leading-tight font-semibold text-[#1d2327]">
                        {counts.comments}
                      </span>
                      {counts.pendingComments > 0 && (
                        <span className="py-0.2 rounded-full bg-[#d63638] px-1.5 text-[10px] font-bold text-white">
                          {counts.pendingComments}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.comments_count"]}
                    </span>
                  </div>
                </Link>

                {/* Categories */}
                <Link
                  href="/admincp/categories"
                  className="group flex items-center gap-3 rounded p-2 transition-colors hover:bg-[#f6f7f7]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] transition-colors group-hover:bg-[#2271b1] group-hover:text-white">
                    <FolderTree className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] leading-tight font-semibold text-[#1d2327]">
                      {counts.categories}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.categories_count"]}
                    </span>
                  </div>
                </Link>

                {/* Tags */}
                <Link
                  href="/admincp/tags"
                  className="group flex items-center gap-3 rounded p-2 transition-colors hover:bg-[#f6f7f7]"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] transition-colors group-hover:bg-[#2271b1] group-hover:text-white">
                    <Tags className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] leading-tight font-semibold text-[#1d2327]">
                      {counts.tags}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.tags_count"]}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Bottom Meta Bar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f1] pt-3.5 text-[12px] text-[#646970]">
                <div className="flex items-center gap-2">
                  <Palette className="size-3.5 text-[#2271b1]" />
                  <span>{runningInfoText}</span>
                  <Link
                    href="/admincp/customize"
                    className="font-medium text-[#2271b1] hover:underline"
                  >
                    ({dict["admin.menu.customize"]})
                  </Link>
                </div>

                <div>
                  {context.siteStatus === "Private" ? (
                    <span className="inline-flex items-center gap-1 text-[#d63638]">
                      <AlertTriangle className="size-3.5" />
                      {dict["admin.dashboard.search_engines_discouraged"]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#00a32a]">
                      <CheckCircle2 className="size-3.5" />
                      {dict["admin.dashboard.search_engines_active"]}
                    </span>
                  )}
                </div>
              </div>
            </DashboardPanel>

            {/* Activity Panel */}
            <DashboardPanel title={dict["admin.dashboard.activity"]}>
              <div>
                <h3 className="mb-2.5 text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.dashboard.recently_published"]}
                </h3>

                {recentPosts.length > 0 ? (
                  <ul className="divide-y divide-[#f0f0f1] border-t border-[#f0f0f1]">
                    {recentPosts.map((post) => (
                      <li
                        key={post.id.toString()}
                        className="flex items-center justify-between gap-4 py-2.5 text-[13px]"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Link
                            href={`/admincp/posts/${post.id.toString()}/edit`}
                            className="truncate font-medium text-[#2271b1] hover:underline"
                          >
                            {post.title || dict["admin.dashboard.untitled"]}
                          </Link>
                          {post.guid && (
                            <Link
                              href={post.guid}
                              target="_blank"
                              className="shrink-0 text-[#a7aaad] hover:text-[#2271b1]"
                              title="View post"
                            >
                              <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                        <time
                          className="shrink-0 text-[12px] text-[#646970]"
                          dateTime={post.date.toISOString()}
                        >
                          {post.date.toLocaleDateString(
                            langContext.code === "ar" ? "ar-EG" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="border-t border-[#f0f0f1] pt-3 text-[13px] text-[#646970]">
                    {dict["admin.dashboard.no_published_posts"]}
                  </p>
                )}

                {/* Recent Comments Section */}
                <div className="mt-5 border-t border-[#c3c4c7] pt-4">
                  <h3 className="mb-2.5 text-[13px] font-semibold text-[#1d2327]">
                    {dict["admin.dashboard.recent_comments"]}
                  </h3>

                  {recentComments.length > 0 ? (
                    <ul className="divide-y divide-[#f0f0f1] border-t border-[#f0f0f1]">
                      {recentComments.map((comment) => (
                        <li
                          key={comment.id.toString()}
                          className="space-y-1 py-2.5 text-[13px]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#1d2327]">
                              {comment.author ||
                                dict["admin.dashboard.anonymous"]}
                            </span>
                            <time className="text-[11px] text-[#646970]">
                              {new Date(comment.date).toLocaleDateString(
                                langContext.code === "ar" ? "ar-EG" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </time>
                          </div>
                          <p className="line-clamp-2 text-[12px] text-[#50575e]">
                            {comment.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="border-t border-[#f0f0f1] pt-2 text-[12px] text-[#646970]">
                      {dict["admin.dashboard.no_comments"]}
                    </p>
                  )}
                </div>
              </div>
            </DashboardPanel>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Quick Draft Panel */}
            <DashboardPanel title={dict["admin.dashboard.quick_draft"]}>
              <QuickDraftWidget recentDrafts={recentDrafts} dict={dict} />
            </DashboardPanel>

            {/* Site Health & Server Overview */}
            <DashboardPanel title={dict["admin.dashboard.site_health"]}>
              <div className="space-y-3.5 text-[13px]">
                <p className="text-[12px] text-[#646970]">
                  {dict["admin.dashboard.site_health_desc"]}
                </p>

                {healthData && (
                  <div className="space-y-2.5 border-t border-[#f0f0f1] pt-3">
                    {/* Database */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[#00a32a]" />
                        <span className="text-[#1d2327]">
                          PostgreSQL{" "}
                          {healthData.database.version?.split(" ")[1] || ""}
                        </span>
                      </div>
                      <span className="rounded bg-[#edfaef] px-2 py-0.5 text-[11px] font-medium text-[#00a32a]">
                        {dict["admin.tools.good"]}
                      </span>
                    </div>

                    {/* Storage */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {healthData.storage.writable ? (
                          <CheckCircle2 className="size-4 text-[#00a32a]" />
                        ) : (
                          <AlertTriangle className="size-4 text-[#d63638]" />
                        )}
                        <span className="text-[#1d2327]">
                          {healthData.storage.writable
                            ? dict["admin.dashboard.storage_ready"]
                            : dict["admin.dashboard.storage_warning"]}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#646970]">
                        {healthData.storage.fileCount}{" "}
                        {dict["admin.menu.media"]}
                      </span>
                    </div>

                    {/* Node Server */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-[#2271b1]" />
                        <span className="text-[#1d2327]">
                          Node.js {healthData.server.nodeVersion}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#646970]">
                        {healthData.server.memoryHeapUsed}
                      </span>
                    </div>
                  </div>
                )}

                <div className="border-t border-[#f0f0f1] pt-3 text-end">
                  <Link
                    href="/admincp/tools/site-health"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2271b1] hover:underline"
                  >
                    <span>{dict["admin.dashboard.details"]}</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </DashboardPanel>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
