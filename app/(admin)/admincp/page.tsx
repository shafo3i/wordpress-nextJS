import Link from "next/link";
import { count, desc, eq, ne, and } from "drizzle-orm";
import {
  AdminShell,
  DashboardPanel,
  getAdminContext,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell";
import { db } from "@/db";
import {
  wpPosts,
  wpComments,
  wpTermTaxonomy,
} from "@/db/schema";
import { getSiteHealthData } from "@/services/database-maintenance.service";
import { WelcomePanel } from "./_components/welcome-panel";
import { QuickDraftWidget } from "./_components/quick-draft-widget";
import {
  FileText,
  FilePlus,
  Image,
  MessageSquare,
  FolderTree,
  Tags,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Palette,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    postResult,
    pageResult,
    mediaResult,
    commentResult,
    pendingCommentResult,
    categoryResult,
    tagResult,
    recentPosts,
    recentDrafts,
    recentComments,
    healthData,
  ] = await Promise.all([
    // Active published/draft posts
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), ne(wpPosts.postStatus, "trash"))),
    // Active pages
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "page"), ne(wpPosts.postStatus, "trash"))),
    // Media attachments
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(eq(wpPosts.postType, "attachment")),
    // Approved comments
    db
      .select({ value: count() })
      .from(wpComments)
      .where(eq(wpComments.commentApproved, "1")),
    // Pending moderation comments
    db
      .select({ value: count() })
      .from(wpComments)
      .where(eq(wpComments.commentApproved, "0")),
    // Categories count
    db
      .select({ value: count() })
      .from(wpTermTaxonomy)
      .where(eq(wpTermTaxonomy.taxonomy, "category")),
    // Tags count
    db
      .select({ value: count() })
      .from(wpTermTaxonomy)
      .where(eq(wpTermTaxonomy.taxonomy, "post_tag")),
    // 5 Recently Published Posts
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        date: wpPosts.postDate,
        guid: wpPosts.guid,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish")))
      .orderBy(desc(wpPosts.postDate))
      .limit(5),
    // 3 Recent Drafts for Quick Draft widget
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        modified: wpPosts.postModified,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "draft")))
      .orderBy(desc(wpPosts.postModified))
      .limit(3),
    // 3 Recent Comments
    db
      .select({
        id: wpComments.commentId,
        author: wpComments.commentAuthor,
        content: wpComments.commentContent,
        date: wpComments.commentDate,
        approved: wpComments.commentApproved,
        postId: wpComments.commentPostId,
      })
      .from(wpComments)
      .where(ne(wpComments.commentApproved, "trash"))
      .orderBy(desc(wpComments.commentDate))
      .limit(3),
    // Site Health overview
    getSiteHealthData().catch(() => null),
  ]);

  return {
    counts: {
      posts: postResult[0]?.value ?? 0,
      pages: pageResult[0]?.value ?? 0,
      media: mediaResult[0]?.value ?? 0,
      comments: commentResult[0]?.value ?? 0,
      pendingComments: pendingCommentResult[0]?.value ?? 0,
      categories: categoryResult[0]?.value ?? 0,
      tags: tagResult[0]?.value ?? 0,
    },
    recentPosts,
    recentDrafts: recentDrafts.map((d) => ({
      id: d.id.toString(),
      title: d.title || "",
      date: new Date(d.modified).toLocaleDateString(),
    })),
    recentComments,
    healthData,
  };
}

export default async function AdminDashboardPage() {
  const [data, context, langContext] = await Promise.all([
    getDashboardData(),
    getAdminContext(),
    getAdminLanguageContext(),
  ]);

  const { counts, recentPosts, recentDrafts, recentComments, healthData } = data;
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const runningInfoText = (
    dict["admin.dashboard.running_info"] || "PressForge running with {theme} theme."
  ).replace("{theme}", context.themeName || "Default");

  return (
    <AdminShell>
      <div dir={direction} className="space-y-6 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#646970]">
              {dict["admin.dashboard.administration"] || "CMS Administration"}
            </p>
            <h1 className="mt-0.5 text-[23px] font-normal leading-normal text-[#1d2327]">
              {dict["admin.dashboard.title"] || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#646970]">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#dcdcde] bg-white px-3 py-1 text-[#2271b1] hover:bg-[#f0f0f1] transition-colors"
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
            <DashboardPanel title={dict["admin.dashboard.at_a_glance"] || "At a Glance"}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                {/* Posts */}
                <Link
                  href="/admincp/posts"
                  className="group flex items-center gap-3 p-2 rounded hover:bg-[#f6f7f7] transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] font-semibold leading-tight text-[#1d2327]">
                      {counts.posts}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.posts_count"] || "Posts"}
                    </span>
                  </div>
                </Link>

                {/* Pages */}
                <Link
                  href="/admincp/pages"
                  className="group flex items-center gap-3 p-2 rounded hover:bg-[#f6f7f7] transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                    <FilePlus className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] font-semibold leading-tight text-[#1d2327]">
                      {counts.pages}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.pages_count"] || "Pages"}
                    </span>
                  </div>
                </Link>

                {/* Media */}
                <Link
                  href="/admincp/media"
                  className="group flex items-center gap-3 p-2 rounded hover:bg-[#f6f7f7] transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                    <Image className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] font-semibold leading-tight text-[#1d2327]">
                      {counts.media}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.media_count"] || "Media Files"}
                    </span>
                  </div>
                </Link>

                {/* Comments */}
                <Link
                  href="/admincp/comments"
                  className="group flex items-center gap-3 p-2 rounded hover:bg-[#f6f7f7] transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                    <MessageSquare className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[19px] font-semibold leading-tight text-[#1d2327]">
                        {counts.comments}
                      </span>
                      {counts.pendingComments > 0 && (
                        <span className="rounded-full bg-[#d63638] px-1.5 py-0.2 text-[10px] font-bold text-white">
                          {counts.pendingComments}
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.comments_count"] || "Comments"}
                    </span>
                  </div>
                </Link>

                {/* Categories */}
                <Link
                  href="/admincp/categories"
                  className="group flex items-center gap-3 p-2 rounded hover:bg-[#f6f7f7] transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                    <FolderTree className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] font-semibold leading-tight text-[#1d2327]">
                      {counts.categories}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.categories_count"] || "Categories"}
                    </span>
                  </div>
                </Link>

                {/* Tags */}
                <Link
                  href="/admincp/tags"
                  className="group flex items-center gap-3 p-2 rounded hover:bg-[#f6f7f7] transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#f0f6fc] text-[#2271b1] group-hover:bg-[#2271b1] group-hover:text-white transition-colors">
                    <Tags className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[19px] font-semibold leading-tight text-[#1d2327]">
                      {counts.tags}
                    </span>
                    <span className="text-[13px] text-[#50575e] group-hover:text-[#2271b1]">
                      {dict["admin.dashboard.tags_count"] || "Tags"}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Bottom Meta Bar */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f1] pt-3.5 text-[12px] text-[#646970]">
                <div className="flex items-center gap-2">
                  <Palette className="size-3.5 text-[#2271b1]" />
                  <span>{runningInfoText}</span>
                  <Link href="/admincp/customize" className="text-[#2271b1] hover:underline font-medium">
                    ({dict["admin.menu.customize"] || "Customize"})
                  </Link>
                </div>

                <div>
                  {context.siteStatus === "Private" ? (
                    <span className="inline-flex items-center gap-1 text-[#d63638]">
                      <AlertTriangle className="size-3.5" />
                      {dict["admin.dashboard.search_engines_discouraged"] || "Search engines discouraged"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#00a32a]">
                      <CheckCircle2 className="size-3.5" />
                      {dict["admin.dashboard.search_engines_active"] || "Search engines indexing active"}
                    </span>
                  )}
                </div>
              </div>
            </DashboardPanel>

            {/* Activity Panel */}
            <DashboardPanel title={dict["admin.dashboard.activity"] || "Activity"}>
              <div>
                <h3 className="mb-2.5 text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.dashboard.recently_published"] || "Recently Published"}
                </h3>

                {recentPosts.length > 0 ? (
                  <ul className="divide-y divide-[#f0f0f1] border-t border-[#f0f0f1]">
                    {recentPosts.map((post) => (
                      <li
                        key={post.id.toString()}
                        className="flex items-center justify-between gap-4 py-2.5 text-[13px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Link
                            href={`/admincp/posts/${post.id.toString()}/edit`}
                            className="font-medium text-[#2271b1] hover:underline truncate"
                          >
                            {post.title || "(no title)"}
                          </Link>
                          {post.guid && (
                            <Link
                              href={post.guid}
                              target="_blank"
                              className="text-[#a7aaad] hover:text-[#2271b1] shrink-0"
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
                          {post.date.toLocaleDateString(langContext.code === "ar" ? "ar-EG" : "en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="border-t border-[#f0f0f1] pt-3 text-[13px] text-[#646970]">
                    {dict["admin.dashboard.no_published_posts"] || "No published posts yet."}
                  </p>
                )}

                {/* Recent Comments Section */}
                <div className="mt-5 pt-4 border-t border-[#c3c4c7]">
                  <h3 className="mb-2.5 text-[13px] font-semibold text-[#1d2327]">
                    {dict["admin.dashboard.recent_comments"] || "Recent Comments"}
                  </h3>

                  {recentComments.length > 0 ? (
                    <ul className="divide-y divide-[#f0f0f1] border-t border-[#f0f0f1]">
                      {recentComments.map((comment) => (
                        <li key={comment.id.toString()} className="py-2.5 text-[13px] space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[#1d2327]">
                              {comment.author || "Anonymous"}
                            </span>
                            <time className="text-[11px] text-[#646970]">
                              {new Date(comment.date).toLocaleDateString(
                                langContext.code === "ar" ? "ar-EG" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </time>
                          </div>
                          <p className="text-[12px] text-[#50575e] line-clamp-2">
                            {comment.content}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="border-t border-[#f0f0f1] pt-2 text-[12px] text-[#646970]">
                      {dict["admin.dashboard.no_comments"] || "No comments yet."}
                    </p>
                  )}
                </div>
              </div>
            </DashboardPanel>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Quick Draft Panel */}
            <DashboardPanel title={dict["admin.dashboard.quick_draft"] || "Quick Draft"}>
              <QuickDraftWidget recentDrafts={recentDrafts} dict={dict} />
            </DashboardPanel>

            {/* Site Health & Server Overview */}
            <DashboardPanel title={dict["admin.dashboard.site_health"] || "Site Health Status"}>
              <div className="space-y-3.5 text-[13px]">
                <p className="text-[12px] text-[#646970]">
                  {dict["admin.dashboard.site_health_desc"] || "Your site health status is monitored."}
                </p>

                {healthData && (
                  <div className="space-y-2.5 border-t border-[#f0f0f1] pt-3">
                    {/* Database */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-[#00a32a]" />
                        <span className="text-[#1d2327]">PostgreSQL {healthData.database.version?.split(" ")[1] || ""}</span>
                      </div>
                      <span className="text-[11px] text-[#00a32a] bg-[#edfaef] px-2 py-0.5 rounded font-medium">
                        {dict["admin.tools.good"] || "Good"}
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
                            ? (dict["admin.dashboard.storage_ready"] || "Uploads Storage Ready")
                            : (dict["admin.dashboard.storage_warning"] || "Storage Warning")}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#646970]">
                        {healthData.storage.fileCount} files
                      </span>
                    </div>

                    {/* Node Server */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="size-4 text-[#2271b1]" />
                        <span className="text-[#1d2327]">Node.js {healthData.server.nodeVersion}</span>
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
                    <span>{dict["admin.dashboard.details"] || "View Details"}</span>
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
