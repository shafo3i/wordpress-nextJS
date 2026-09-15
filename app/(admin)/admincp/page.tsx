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
            <form className="space-y-3" action="/cms-admin/posts/new">
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
