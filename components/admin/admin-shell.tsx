import Link from "next/link";
import { headers } from "next/headers";
import { count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { wpComments, wpOptions } from "@/db/schema";
import { Home, MessageSquare, Plus, ShieldCheck } from "lucide-react";
import { AdminNav } from "./admin-nav";

export async function getAdminContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [siteName, sitePublic, comments, activeTheme] = await Promise.all([
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "blogname")).limit(1),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "blog_public")).limit(1),
    db.select({ value: count() }).from(wpComments),
    db.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, "current_theme")).limit(1),
  ]);

  return {
    userName: session?.user.name ?? "",
    siteName: siteName[0]?.value ?? "WordPress Clone",
    commentCount: comments[0]?.value ?? 0,
    themeName: activeTheme[0]?.value ?? "Default Theme",
    siteStatus: sitePublic[0]?.value === "0" ? "Private" : "Public",
  };
}

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const context = await getAdminContext();
  return (
    <div className="wp-admin-shell">
      <header className="wp-admin-topbar">
        <div className="wp-admin-topbar-left">
          <Link
            aria-label="CMS dashboard"
            className="wp-admin-brand"
            href="/admincp"
          >
            C
          </Link>
          <Link
            className="wp-admin-top-link"
            href="/"
          >
            <Home aria-hidden="true" className="size-3.5" />
            <span>{context.siteName || "—"}</span>
          </Link>
          <Link
            className="wp-admin-top-link"
            href="/admincp/comments"
          >
            <MessageSquare aria-hidden="true" className="size-3.5" />
            <span>{context.commentCount}</span>
          </Link>
          <Link
            className="wp-admin-top-link"
            href="/admincp/posts/new"
          >
            <Plus aria-hidden="true" className="size-4" />
            <span>New</span>
          </Link>
        </div>
        <div className="wp-admin-topbar-right">
          <span className="wp-admin-user">Howdy, {context.userName || "—"}</span>
          <Link className="wp-admin-user-link" href="/cms-login">
            Log Out
          </Link>
        </div>
      </header>

      <div className="wp-admin-layout">
        <aside className="wp-admin-sidebar">
          <AdminNav />
          <div className="wp-admin-sidebar-footer">
            <ShieldCheck aria-hidden="true" className="mb-2 size-4" />
            Site administration
          </div>
        </aside>

        <main className="wp-admin-main">{children}</main>
      </div>
    </div>
  );
}

export function DashboardPanel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border border-[#c3c4c7] bg-white shadow-sm">
      <header className="border-b border-[#dcdcde] px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

