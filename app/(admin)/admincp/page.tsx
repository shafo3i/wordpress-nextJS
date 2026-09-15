import { count, desc, eq } from "drizzle-orm";
import { AdminShell, DashboardPanel, getAdminContext } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { wpComments, wpPosts } from "@/db/schema";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [postResult, pageResult, commentResult, recentPosts] = await Promise.all([
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(eq(wpPosts.postType, "post")),
    db
      .select({ value: count() })
      .from(wpPosts)
      .where(eq(wpPosts.postType, "page")),
    db.select({ value: count() }).from(wpComments),
    db
      .select({ id: wpPosts.id, title: wpPosts.postTitle, date: wpPosts.postDate })
      .from(wpPosts)
      .where(eq(wpPosts.postStatus, "publish"))
      .orderBy(desc(wpPosts.postDate))
      .limit(5),
  ]);

  return {
    counts: {
      posts: postResult[0]?.value ?? 0,
      pages: pageResult[0]?.value ?? 0,
      comments: commentResult[0]?.value ?? 0,
    },
    recentPosts,
  };
}

export default async function AdminDashboardPage() {
  const { counts, recentPosts } = await getDashboardData();
  const context = await getAdminContext();

  return (
    <AdminShell>
      <div className="mb-5 flex items-center justify-between border-b border-[#c3c4c7] pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#646970]">
            CMS Administration
          </p>
          <h1 className="mt-1 text-2xl font-normal">Dashboard</h1>
        </div>
        <span className="text-sm text-[#646970]">{context.siteName || "—"}</span>
      </div>

      {/* Demo Status & Implementation Banner */}
      <div className="mb-6 rounded border border-[#2271b1]/20 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded bg-[#2271b1] px-2.5 py-0.5 text-xs font-semibold text-white">
              🚀 Demo Mode & Feature Status
            </div>
            <h2 className="mt-2 text-lg font-semibold text-[#1d2327]">
              Welcome to the PressForge Live Demonstration
            </h2>
            <p className="mt-1 text-sm text-[#50575e]">
              This reference panel outlines active features, demo access credentials, and known in-progress areas.
            </p>
          </div>
          <div className="shrink-0 rounded border border-[#dcdcde] bg-white p-3 text-xs shadow-xs">
            <span className="font-semibold text-[#1d2327]">Administrator Credentials</span>
            <div className="mt-1.5 space-y-1 font-mono text-[#50575e]">
              <div><span className="text-gray-400">Email:</span> admin@pressforge.local</div>
              <div><span className="text-gray-400">Pass:</span> Admin123456!</div>
              <div><span className="text-gray-400">Role:</span> Administrator</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-[#dcdcde] pt-4 md:grid-cols-2">
          {/* Active Features */}
          <div className="rounded border border-emerald-200 bg-emerald-50/40 p-3.5">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 text-sm">
              <span className="inline-block size-2 rounded-full bg-emerald-500"></span>
              Fully Working & Interactive
            </div>
            <ul className="mt-2 space-y-1 text-xs text-emerald-950">
              <li>• <strong>Posts System:</strong> All Posts list, Create/Edit with TinyMCE, draft/publish states, tags & categories (<a href="/admincp/posts" className="underline font-medium hover:text-emerald-700">View Posts</a>).</li>
              <li>• <strong>Pages System:</strong> Author & publish custom pages served dynamically at <code className="bg-emerald-100/70 px-1 py-0.5 rounded">/[slug]</code> (<a href="/admincp/pages" className="underline font-medium hover:text-emerald-700">View Pages</a>).</li>
              <li>• <strong>Themes:</strong> 4 complete themes (Broadsheet, Magazine, Midnight, Longform) (<a href="/admincp/themes" className="underline font-medium hover:text-emerald-700">Appearance &gt; Themes</a>).</li>
              <li>• <strong>Theme Customizer:</strong> Real-time palette generator, font switcher, navigation & header color tokens (<a href="/admincp/customize" className="underline font-medium hover:text-emerald-700">Customize</a>).</li>
              <li>• <strong>Widget & Plugin Architecture:</strong> Dynamic sidebars, active plugins hook system (<a href="/admincp/widgets" className="underline font-medium hover:text-emerald-700">Widgets</a>).</li>
              <li>• <strong>Public Newsroom:</strong> Responsive layout, 10+ editorial blocks, dynamic article reader at <code className="bg-emerald-100/70 px-1 py-0.5 rounded">/posts/[slug]</code>.</li>
            </ul>
          </div>

          {/* In-Progress & Known Dead Links */}
          <div className="rounded border-amber-200 bg-amber-50/50 p-3.5 border">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-sm">
              <span className="inline-block size-2 rounded-full bg-amber-500"></span>
              Known In-Progress / Placeholder Links
            </div>
            <ul className="mt-2 space-y-1 text-xs text-amber-950">
              <li>• <strong>Admin Shell Placeholders:</strong> Media Library, Comments moderation table, User management, and Tools/Settings are UI stubs.</li>
              <li>• <strong>Footer Governance Links:</strong> Public footer links (<em>Editorial Standards, Privacy, Terms, Corrections</em>) return 404 until authored in <a href="/admincp/pages/new" className="underline font-medium hover:text-amber-800">Pages &gt; Add New</a>.</li>
              <li>• <strong>Category & Tag Archives:</strong> Tag/category badge clicks (<code className="bg-amber-100/70 px-1 py-0.5 rounded">/category/[slug]</code>, <code className="bg-amber-100/70 px-1 py-0.5 rounded">/tag/[slug]</code>) are awaiting dedicated archive query pages.</li>
              <li>• <strong>Empty DB Fallbacks:</strong> If the database has 0 posts, public layouts use curated fallback mocks until seeded or published.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <div className="space-y-5">
          <DashboardPanel title="At a Glance">
            <div className="grid grid-cols-3 divide-x divide-[#dcdcde] text-center">
              <a className="px-2 text-[#2271b1] hover:underline" href="/admincp/posts">
                <strong className="block text-2xl font-normal text-[#23282d]">{counts.posts}</strong>
                Posts
              </a>
              <a className="px-2 text-[#2271b1] hover:underline" href="/admincp/pages">
                <strong className="block text-2xl font-normal text-[#23282d]">{counts.pages}</strong>
                Pages
              </a>
              <a className="px-2 text-[#2271b1] hover:underline" href="/admincp/comments">
                <strong className="block text-2xl font-normal text-[#23282d]">{counts.comments}</strong>
                Comments
              </a>
            </div>
            <p className="mt-5 border-t border-[#dcdcde] pt-3 text-sm text-[#646970]">
              Your CMS is running with the active site configuration.
            </p>
          </DashboardPanel>

          <DashboardPanel title="Activity">
            <h3 className="mb-3 text-sm font-semibold">Recently Published</h3>
            {recentPosts.length ? (
              <ul className="divide-y divide-[#dcdcde] border-t border-[#dcdcde]">
                {recentPosts.map((post) => (
                  <li className="flex items-center justify-between gap-4 py-3 text-sm" key={post.id.toString()}>
                    <span>{post.title || "(no title)"}</span>
                    <time className="shrink-0 text-[#646970]" dateTime={post.date.toISOString()}>
                      {post.date.toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-[#dcdcde] pt-3 text-sm text-[#646970]">
                No published posts yet.
              </p>
            )}
          </DashboardPanel>
        </div>

        <div className="space-y-5">
          <DashboardPanel title="Quick Draft">
            <form className="space-y-3" action="/admincp/posts/new">
              <Input
                aria-label="Draft title"
                name="title"
                placeholder="Title"
                type="text"
              />
              <Textarea
                aria-label="Draft content"
                name="content"
                placeholder="What is on your mind?"
              />
              <Button className="bg-[#2271b1] text-white hover:bg-[#135e96]" type="submit">
                Save Draft
              </Button>
            </form>
          </DashboardPanel>

          <DashboardPanel title="Site Information">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-[#dcdcde] pb-2">
                <dt className="text-[#646970]">Site</dt>
                <dd>{context.siteName || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#dcdcde] pb-2">
                <dt className="text-[#646970]">Theme</dt>
                <dd>{context.themeName || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#646970]">Status</dt>
                <dd className={context.siteStatus === "Public" ? "text-green-700" : "text-[#646970]"}>{context.siteStatus}</dd>
              </div>
            </dl>
          </DashboardPanel>
        </div>
      </div>
    </AdminShell>
  );
}
