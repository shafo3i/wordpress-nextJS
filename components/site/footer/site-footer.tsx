"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { WidgetItem } from "@/widgets/types";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import { t, localizePath } from "@/components/site/utils";

interface SiteFooterProps {
  theme: FrontEndThemeContext;
  footerWidgets?: {
    col1?: WidgetItem[];
    col2?: WidgetItem[];
    col3?: WidgetItem[];
  };
}

export function SiteFooter({ theme, footerWidgets }: SiteFooterProps) {
  const mods = theme.mods || {};
  const isDark = theme.darkMode;
  const primaryColor = mods.primaryColor || theme.primaryColor || "#2271b1";
  const cols = mods.footerColumns || 4;

  const col1Items = footerWidgets?.col1 || [];
  const col2Items = footerWidgets?.col2 || [];
  const col3Items = footerWidgets?.col3 || [];

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const footerBg = mods.footerBg || (isDark ? "#030712" : "#0f172a");
  const footerTextColor = mods.footerTextColor || "#94a3b8";
  const footerHeadingColor = mods.footerHeadingColor || "#ffffff";
  const footerLinkColor = mods.footerLinkColor || footerTextColor;
  const footerBorder = mods.footerBorderColor || mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0");
  const subFooterText = mods.subFooterTextColor || footerTextColor;

  return (
    <footer
      style={{
        backgroundColor: footerBg,
        color: footerTextColor,
        borderColor: footerBorder,
      }}
      className="border-t mt-16 transition-colors"
    >
      <div className="mx-auto theme-container px-6 py-12">
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
        <div data-footer-widgets="true" className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-8 py-8 items-start`}>
          {/* Column 1 */}
          <div className="space-y-4">
            {col1Items.length > 0 ? (
              col1Items.map((item) => (
                <SidebarWidgetRenderer key={item.id} item={item} theme={theme} />
              ))
            ) : (
              <div>
                <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">
                  {t("site.about_newsroom", theme, "About Newsroom")}
                </h4>
                <p style={{ color: footerTextColor }} className="text-xs leading-relaxed opacity-90">
                  {t("site.about_newsroom_desc", theme, "Operating with verifiable editorial integrity, original investigative reporting, and real-time market telemetry.")}
                </p>
              </div>
            )}
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {col2Items.length > 0 ? (
              col2Items.map((item) => (
                <SidebarWidgetRenderer key={item.id} item={item} theme={theme} />
              ))
            ) : (
              <div>
                <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">
                  {t("site.key_desks", theme, "Key Desks")}
                </h4>
                <ul className="text-xs space-y-2">
                  <li>
                    <Link href={localizePath("/category/news", theme.locale, theme.defaultLocale)} style={{ color: footerLinkColor }} className="hover:opacity-80">
                      {t("site.national_wire", theme, "National Wire")}
                    </Link>
                  </li>
                  <li>
                    <Link href={localizePath("/category/business", theme.locale, theme.defaultLocale)} style={{ color: footerLinkColor }} className="hover:opacity-80">
                      {t("site.commercial_briefings", theme, "Commercial Briefings")}
                    </Link>
                  </li>
                  <li>
                    <Link href={localizePath("/category/technology", theme.locale, theme.defaultLocale)} style={{ color: footerLinkColor }} className="hover:opacity-80">
                      {t("site.silicon_systems", theme, "Silicon & Artificial Systems")}
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Column 3 */}
          {cols >= 3 && (
            <div className="space-y-4">
              {col3Items.length > 0 ? (
                col3Items.map((item) => (
                  <SidebarWidgetRenderer key={item.id} item={item} theme={theme} />
                ))
              ) : (
                <div>
                  <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">
                    {t("site.governance", theme, "Governance")}
                  </h4>
                  <ul className="text-xs space-y-2">
                    <li>
                      <Link href={localizePath("/editorial-standards", theme.locale, theme.defaultLocale)} style={{ color: footerLinkColor }} className="hover:opacity-80">
                        {t("site.verification_code", theme, "Verification Code")}
                      </Link>
                    </li>
                    <li>
                      <Link href={localizePath("/corrections", theme.locale, theme.defaultLocale)} style={{ color: footerLinkColor }} className="hover:opacity-80">
                        {t("site.corrections_protocol", theme, "Corrections Protocol")}
                      </Link>
                    </li>
                    <li>
                      <Link href={localizePath("/privacy", theme.locale, theme.defaultLocale)} style={{ color: footerLinkColor }} className="hover:opacity-80">
                        {t("site.privacy_rights", theme, "Privacy Rights")}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Column 4 */}
          {cols >= 4 && (
            <div>
              <h4 style={{ color: footerHeadingColor }} className="font-bold text-xs uppercase tracking-wider mb-3">
                {t("site.broadcast_stream", theme, "Broadcast Stream")}
              </h4>
              <p style={{ color: footerTextColor }} className="text-xs leading-relaxed opacity-90">
                {t("site.broadcast_stream_desc", theme, "Daily audio dispatches published every weekday at 06:00 UTC.")}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar with Copyright & Back-to-Top */}
        <div
          style={{
            borderColor: footerBorder,
            backgroundColor: mods.subFooterBg || undefined,
          }}
          className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
            mods.subFooterBg ? "-mx-6 px-6 pb-6 mt-6 rounded-b" : ""
          }`}
        >
          <p style={{ color: subFooterText }} className="opacity-90">
            {mods.footerCopyright || theme.footerCopyright || "© 2026 PressForge. All rights reserved."}
          </p>

          <div className="flex items-center gap-4">
            {mods.showBackToTop !== false && (
              <button
                type="button"
                onClick={scrollToTop}
                style={{ color: subFooterText }}
                className="flex items-center gap-1.5 text-xs hover:opacity-100 opacity-80 transition-opacity"
              >
                <ArrowUp className="size-3.5" /> {t("site.back_to_top", theme, "Back to Top")}
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
