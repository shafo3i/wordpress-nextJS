"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { WidgetItem } from "@/widgets/types";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import { t, localizePath } from "@/components/site/utils";
import { SocialLinks } from "@/components/site/social-links";

interface SiteFooterProps {
  theme: FrontEndThemeContext;
  footerWidgets?: {
    col1?: WidgetItem[];
    col2?: WidgetItem[];
    col3?: WidgetItem[];
  };
}

const FOOTER_GRID: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export function SiteFooter({ theme, footerWidgets }: SiteFooterProps) {
  const mods = theme.mods || {};
  const cols = mods.footerColumns || 4;

  const col1Items = footerWidgets?.col1 || [];
  const col2Items = footerWidgets?.col2 || [];
  const col3Items = footerWidgets?.col3 || [];

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const footerBg = "var(--theme-footer-bg)";
  const footerTextColor = "var(--theme-footer-text)";
  const footerHeadingColor = "var(--theme-footer-heading)";
  const footerLinkColor = "var(--theme-footer-link)";
  const footerBorder = "var(--theme-footer-border)";
  const subFooterText = "var(--theme-subfooter-text)";

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
          style={{ borderColor: footerBorder }}
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
        <div data-footer-widgets="true" className={`grid grid-cols-1 sm:grid-cols-2 ${FOOTER_GRID[cols] ?? FOOTER_GRID[4]} gap-8 py-8 items-start`}>
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
            backgroundColor: "var(--theme-subfooter-bg)",
          }}
          className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs -mx-6 px-6 pb-6 mt-6 rounded-b"
        >
          <p style={{ color: subFooterText }} className="opacity-90">
            {mods.footerCopyright || theme.footerCopyright}
          </p>

          <div className="flex items-center gap-4">
            {mods.showFooterSocials !== false && <SocialLinks mods={mods} />}$([Environment]::NewLine)            {mods.showBackToTop !== false && (
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
