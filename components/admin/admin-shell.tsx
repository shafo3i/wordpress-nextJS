import Link from "next/link";
import { headers, cookies } from "next/headers";
import { count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { wpComments, wpOptions } from "@/db/schema";
import { Home, MessageSquare, Plus, ShieldCheck, Globe } from "lucide-react";
import { AdminNav } from "./admin-nav";
import {
  getLanguageByCode,
  getDefaultLanguage,
  getActiveLanguages,
  getTranslations,
} from "@/services/language.service";
import { switchAdminLanguageAction } from "@/app/(admin)/admincp/languages/action";

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

export async function getAdminLanguageContext() {
  const cookieStore = await cookies();
  const requestedCode = cookieStore.get("admin_lang")?.value;

  let currentLang = requestedCode ? await getLanguageByCode(requestedCode) : null;
  if (!currentLang) {
    currentLang = await getDefaultLanguage();
  }

  const code = currentLang?.code || "en";
  const direction = currentLang?.direction || "ltr";

  const [dict, allLanguages] = await Promise.all([
    getTranslations(code),
    getActiveLanguages(),
  ]);

  return {
    currentLang,
    code,
    direction,
    dict,
    allLanguages,
  };
}

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const [context, langContext] = await Promise.all([
    getAdminContext(),
    getAdminLanguageContext(),
  ]);

  const dict = langContext.dict;

  return (
    <div className="wp-admin-shell" dir={langContext.direction}>
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
            <span>{dict["admin.menu.add_new"] || "New"}</span>
          </Link>
        </div>

        <div className="wp-admin-topbar-right flex items-center gap-3">
          {/* Admin Language Switcher */}
          {langContext.allLanguages.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-[#c3c4c7] border-e border-[#3c434a] pe-3">
              <Globe className="size-3.5 text-[#a7aaad]" />
              <form action={switchAdminLanguageAction} className="flex items-center gap-1">
                {langContext.allLanguages.map((lang, idx) => {
                  const isCurrent = lang.code === langContext.code;
                  return (
                    <span key={lang.code} className="flex items-center">
                      {idx > 0 && <span className="mx-1 text-[#50575e]">|</span>}
                      {isCurrent ? (
                        <span className="font-semibold text-white">
                          {lang.nativeName || lang.name}
                        </span>
                      ) : (
                        <button
                          className="text-[#72aee6] hover:text-white cursor-pointer transition-colors"
                          name="code"
                          type="submit"
                          value={lang.code}
                        >
                          {lang.nativeName || lang.name}
                        </button>
                      )}
                    </span>
                  );
                })}
              </form>
            </div>
          )}

          <span className="wp-admin-user">
            {dict["admin.menu.howdy"] || "Howdy"}, {context.userName || "—"}
          </span>
          <Link className="wp-admin-user-link" href="/cms-login">
            {dict["admin.menu.logout"] || "Log Out"}
          </Link>
        </div>
      </header>

      <div className="wp-admin-layout">
        <aside className="wp-admin-sidebar">
          <AdminNav dict={dict} />
          <div className="wp-admin-sidebar-footer">
            <ShieldCheck aria-hidden="true" className="mb-2 size-4" />
            {dict["admin.menu.site_administration"] || "Site administration"}
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
