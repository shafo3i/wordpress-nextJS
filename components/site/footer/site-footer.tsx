"use client";

import Link from "next/link";
import { ArrowUp, Share2 } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";

export function SiteFooter({ theme }: { theme: FrontEndThemeContext }) {
  const mods = theme.mods || {};
  const isDark = theme.darkMode;
  const primaryColor = mods.primaryColor || theme.primaryColor || "#2271b1";
  const cols = mods.footerColumns || 4;

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      style={{
        backgroundColor: mods.footerBg || (isDark ? "#030712" : "#0f172a"),
        color: mods.footerTextColor || "#94a3b8",
        borderColor: mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0"),
      }}
      className="border-t mt-16 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Top Header inside Footer */}
        <div
          style={{ borderColor: isDark ? "#1f2937" : "rgba(255,255,255,0.1)" }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 border-b pb-8"
        >
          <div>
            <span
              style={{ color: "#ffffff" }}
              className="text-2xl font-black tracking-tight font-serif"
            >
              {theme.siteTitle}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">{theme.siteTagline}</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            {theme.footerNav.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                className="hover:text-white transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Multi-Column Layout */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-8 py-8`}>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">About Newsroom</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Operating with verifiable editorial integrity, original investigative reporting, and real-time market telemetry.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Key Desks</h4>
            <ul className="text-xs space-y-2 text-slate-400">
              <li><Link href="/category/news" className="hover:text-white">National Wire</Link></li>
              <li><Link href="/category/business" className="hover:text-white">Commercial Briefings</Link></li>
              <li><Link href="/category/technology" className="hover:text-white">Silicon & Artificial Systems</Link></li>
            </ul>
          </div>

          {cols >= 3 && (
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Governance</h4>
              <ul className="text-xs space-y-2 text-slate-400">
                <li><Link href="/editorial-standards" className="hover:text-white">Verification Code</Link></li>
                <li><Link href="/corrections" className="hover:text-white">Corrections Protocol</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Rights</Link></li>
              </ul>
            </div>
          )}

          {cols >= 4 && (
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Broadcast Stream</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Daily audio dispatches published every weekday at 06:00 UTC.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar with Copyright & Back-to-Top */}
        <div
          style={{ borderColor: isDark ? "#1f2937" : "rgba(255,255,255,0.1)" }}
          className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400"
        >
          <p>{mods.footerCopyright || theme.footerCopyright || "© 2026 Signal News. All rights reserved."}</p>

          <div className="flex items-center gap-4">
            {mods.showBackToTop !== false && (
              <button
                type="button"
                onClick={scrollToTop}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <ArrowUp className="size-3.5" /> Back to Top
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
