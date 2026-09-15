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

  const footerBg = mods.footerBg || (isDark ? "#030712" : "#0f172a");
  const footerTextColor = mods.footerTextColor || "#94a3b8";
  const footerHeadingColor = mods.footerHeadingColor || "#ffffff";
  const footerLinkColor = mods.footerLinkColor || footerTextColor;

  return (
    <footer
      style={{
        backgroundColor: footerBg,
        color: footerTextColor,
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
              style={{ color: footerHeadingColor }}
              className="text-2xl font-black tracking-tight font-serif"
            >
              {theme.siteTitle}
            </span>
            <p style={{ color: footerTextColor }} className="text-xs mt-0.5 opacity-80">{theme.siteTagline}</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
            {theme.footerNav.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                style={{ color: footerLinkColor }}
                className="hover:opacity-80 transition-opacity"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        {/* Multi-Column Layout */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-8 py-8`}>
          <div>
            <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">About Newsroom</h4>
            <p style={{ color: footerTextColor }} className="text-xs leading-relaxed opacity-90">
              Operating with verifiable editorial integrity, original investigative reporting, and real-time market telemetry.
            </p>
          </div>

          <div>
            <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">Key Desks</h4>
            <ul className="text-xs space-y-2">
              <li><Link href="/category/news" style={{ color: footerLinkColor }} className="hover:opacity-80">National Wire</Link></li>
              <li><Link href="/category/business" style={{ color: footerLinkColor }} className="hover:opacity-80">Commercial Briefings</Link></li>
              <li><Link href="/category/technology" style={{ color: footerLinkColor }} className="hover:opacity-80">Silicon & Artificial Systems</Link></li>
            </ul>
          </div>

          {cols >= 3 && (
            <div>
              <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">Governance</h4>
              <ul className="text-xs space-y-2">
                <li><Link href="/editorial-standards" style={{ color: footerLinkColor }} className="hover:opacity-80">Verification Code</Link></li>
                <li><Link href="/corrections" style={{ color: footerLinkColor }} className="hover:opacity-80">Corrections Protocol</Link></li>
                <li><Link href="/privacy" style={{ color: footerLinkColor }} className="hover:opacity-80">Privacy Rights</Link></li>
              </ul>
            </div>
          )}

          {cols >= 4 && (
            <div>
              <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">Broadcast Stream</h4>
              <p style={{ color: footerTextColor }} className="text-xs leading-relaxed opacity-90">
                Daily audio dispatches published every weekday at 06:00 UTC.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar with Copyright & Back-to-Top */}
        <div
          style={{ borderColor: isDark ? "#1f2937" : "rgba(255,255,255,0.1)" }}
          className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
        >
          <p style={{ color: footerTextColor }} className="opacity-80">
            {mods.footerCopyright || theme.footerCopyright || "© 2026 PressForge. All rights reserved."}
          </p>

          <div className="flex items-center gap-4">
            {mods.showBackToTop !== false && (
              <button
                type="button"
                onClick={scrollToTop}
                style={{ color: footerTextColor }}
                className="flex items-center gap-1.5 text-xs hover:opacity-100 opacity-80 transition-opacity"
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
