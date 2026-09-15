"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Clock, Share2, ArrowRight } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { getFontFamilyCss } from "@/components/site/theme-dynamic-styles";
import { isDarkTheme } from "@/components/site/utils";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

// Color luminance contrast helper to ensure pill badges and links never clash
function isColorDark(hexColor?: string): boolean {
  if (!hexColor) return false;
  const hex = hexColor.trim().replace("#", "");
  if (hex.length !== 6 && hex.length !== 3) return false;
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

export function SiteHeader({ theme }: { theme: FrontEndThemeContext }) {
  const mods = theme.mods || {};
  const isDark = isDarkTheme(theme);
  const slug = theme.themeSlug || "pressforge-broadsheet";
  const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);

  const headingFont = getFontFamilyCss(
    mods.headingFontFamily,
    mods.headingFont ||
      (theme.headingFont as "serif" | "sans" | undefined) ||
      (slug.includes("magazine") || slug.includes("midnight") ? "sans" : "serif")
  );

  const headerLayout = mods.headerLayout || theme.headerLayout || "classic";
  const primaryColor = mods.primaryColor || theme.primaryColor || "#2271b1";
  const secondaryColor = mods.secondaryColor || "#135e96";
  const borderStyle = mods.headerBorderStyle || (slug.includes("magazine") ? "none" : "double");

  // Determine actual effective nav background & contrast
  const effectiveNavBarBg =
    mods.navBarBg ||
    (headerLayout === "magazine"
      ? (isDark ? "#0f172a" : "#0f172a")
      : headerLayout === "minimal"
      ? mods.headerBg || (isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)")
      : (isDark ? "#0f172a" : "#ffffff"));

  const isNavDark = isColorDark(effectiveNavBarBg) || isDark;

  const effectiveHeaderBg =
    mods.headerBg ||
    (headerLayout === "magazine"
      ? (isDark ? "#020617" : "#ffffff")
      : headerLayout === "centered"
      ? (isDark ? "#0a0f1d" : "#ffffff")
      : headerLayout === "minimal"
      ? (isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)")
      : (isDark ? "#0a0f1d" : "#f8f7f4"));

  const isHeaderDark = isColorDark(effectiveHeaderBg) || isDark;

  const borderBottomCss =
    borderStyle === "double"
      ? `4px double ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`
      : borderStyle === "solid"
      ? `1px solid ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`
      : "none";

  // Top Bar Ticker & Utility
  const renderTopBar = () => {
    if (mods.showTopBar === false) return null;

    const topBarBg = mods.topBarBg || (headerLayout === "magazine" ? primaryColor : isDark ? "#030712" : "#0f172a");
    const topBarTextColor = mods.topBarTextColor || "#ffffff";

    return (
      <div
        style={{
          backgroundColor: topBarBg,
          color: topBarTextColor,
        }}
        className="px-4 sm:px-6 py-1.5 text-xs border-b border-black/10"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse flex-shrink-0">
              Breaking
            </span>
            <span className="text-xs font-medium truncate max-w-xl">
              {mods.topBarTickerText || "Editorial dispatch: Global supply chains adjust to new infrastructure corridors"}
            </span>
          </div>
          {mods.showDateInHeader !== false && (
            <span className="text-[11px] opacity-75 font-mono hidden sm:inline flex-shrink-0">
              {formatDate(new Date())}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Nav Items
  const renderNavLinks = () => {
    return (
      <div
        className={`flex items-center gap-1.5 sm:gap-2 flex-wrap ${
          mods.navAlignment === "center"
            ? "justify-center"
            : mods.navAlignment === "right"
            ? "justify-end"
            : mods.navAlignment === "between"
            ? "justify-between"
            : "justify-start"
        }`}
      >
        {theme.primaryNav.map((item, idx) => {
          const isPill = mods.navStyle === "pill-badge";
          const isUnderlined = mods.navStyle === "underlined";
          const isHovered = activeHoverIdx === idx;
          const isActive = idx === 0;

          // Compute dynamic pill styling
          let pillBg = "transparent";
          let linkColor = mods.navLinkColor || (isNavDark ? "#f8fafc" : "#1d2327");

          if (isPill) {
            if (isActive) {
              pillBg = primaryColor;
              linkColor = "#ffffff";
            } else if (isHovered) {
              pillBg = isNavDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.12)";
              linkColor = mods.navLinkHoverColor || (isNavDark ? "#ffffff" : primaryColor);
            } else {
              pillBg = isNavDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)";
              linkColor = mods.navLinkColor || (isNavDark ? "#f8fafc" : "#334155");
            }
          } else if (isUnderlined) {
            if (isActive) {
              linkColor = primaryColor;
            } else if (isHovered) {
              linkColor = mods.navLinkHoverColor || primaryColor;
            }
          } else {
            // Classic text
            if (isActive) {
              linkColor = primaryColor;
            } else if (isHovered) {
              linkColor = mods.navLinkHoverColor || primaryColor;
            }
          }

          return (
            <Link
              key={item.id}
              href={item.url}
              onMouseEnter={() => setActiveHoverIdx(idx)}
              onMouseLeave={() => setActiveHoverIdx(null)}
              style={{
                backgroundColor: isPill ? pillBg : undefined,
                color: linkColor,
                textTransform: mods.navUppercase ? "uppercase" : "none",
                borderColor: isUnderlined && isActive ? primaryColor : undefined,
              }}
              className={`text-xs font-bold tracking-wider transition-all duration-150 whitespace-nowrap ${
                isPill
                  ? "px-3 py-1 rounded-md shadow-xs"
                  : isUnderlined && isActive
                  ? "border-b-2 pb-0.5"
                  : "hover:opacity-85"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </div>
    );
  };

  // 1. MINIMAL LAYOUT
  if (headerLayout === "minimal") {
    return (
      <header
        style={{
          backgroundColor: mods.headerBg || (isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)"),
          borderBottom: borderBottomCss,
        }}
        className={`transition-colors backdrop-blur-sm z-40 ${mods.stickyHeader ? "sticky top-0" : ""}`}
      >
        {renderTopBar()}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {mods.logoUrl ? (
              <img
                src={mods.logoUrl}
                alt="Logo"
                style={{ width: `${mods.logoWidth || 140}px` }}
              />
            ) : (
              mods.showSiteTitle !== false && (
                <div>
                  <Link
                    href="/"
                    style={{
                      fontFamily: `${headingFont}, sans-serif`,
                      color: mods.headerTextColor || (isDark ? "#ffffff" : primaryColor),
                    }}
                    className="text-2xl font-bold tracking-tight"
                  >
                    {theme.siteTitle}
                  </Link>
                  {mods.showTagline !== false && (
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{theme.siteTagline}</p>
                  )}
                </div>
              )
            )}
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {renderNavLinks()}
          </nav>

          <div className="flex items-center gap-3">
            {mods.showSearchInNav !== false && (
              <button type="button" className="p-1.5 text-slate-400 hover:text-slate-600">
                <Search className="size-4" />
              </button>
            )}
            <Link
              href="/about"
              style={{ borderColor: primaryColor, color: primaryColor }}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // 2. MAGAZINE MULTI-TIER LAYOUT
  if (headerLayout === "magazine") {
    return (
      <header
        style={{
          backgroundColor: effectiveHeaderBg,
          borderBottom: borderBottomCss,
        }}
        className={`transition-colors ${mods.stickyHeader ? "sticky top-0 z-40" : ""}`}
      >
        {renderTopBar()}

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            {mods.logoUrl ? (
              <img
                src={mods.logoUrl}
                alt="Logo"
                style={{ width: `${mods.logoWidth || 200}px` }}
              />
            ) : (
              mods.showSiteTitle !== false && (
                <div>
                  <Link
                    href="/"
                    style={{
                      fontFamily: `${headingFont}, sans-serif`,
                      color: mods.headerTextColor || (isHeaderDark ? "#ffffff" : primaryColor),
                      textTransform: mods.headingTransform || "none",
                      fontWeight: mods.headingFontWeight || "900",
                    }}
                    className="text-3xl sm:text-5xl font-black uppercase tracking-tighter"
                  >
                    {theme.siteTitle}
                  </Link>
                  {mods.showTagline !== false && (
                    <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mt-0.5">
                      {theme.siteTagline}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <span
              style={{ backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }}
              className="rounded-lg px-3 py-1 text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5"
            >
              <Clock className="size-3 text-rose-500" />
              Live Newsroom Edition
            </span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: effectiveNavBarBg,
            color: mods.navLinkColor || (isNavDark ? "#f8fafc" : "#1d2327"),
          }}
          className={`border-t ${isNavDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {renderNavLinks()}
            {mods.showSearchInNav !== false && (
              <div className={`pl-4 hidden sm:block ${isNavDark ? "text-slate-400" : "text-slate-500"}`}>
                <Search className="size-3.5" />
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  // 3. CENTERED EDITORIAL LAYOUT
  if (headerLayout === "centered") {
    return (
      <header
        style={{
          backgroundColor: effectiveHeaderBg,
          borderBottom: borderBottomCss,
        }}
        className={`transition-colors ${mods.stickyHeader ? "sticky top-0 z-40" : ""}`}
      >
        {renderTopBar()}

        <div className="mx-auto max-w-7xl px-6 py-8 text-center space-y-2">
          {mods.logoUrl ? (
            <img
              src={mods.logoUrl}
              alt="Logo"
              style={{ width: `${mods.logoWidth || 180}px` }}
              className="mx-auto"
            />
          ) : (
            mods.showSiteTitle !== false && (
              <Link
                href="/"
                style={{
                  fontFamily: `${headingFont}, serif`,
                  color: mods.headerTextColor || (isHeaderDark ? "#ffffff" : primaryColor),
                  textTransform: mods.headingTransform || "none",
                  fontWeight: mods.headingFontWeight || "700",
                }}
                className="text-4xl sm:text-5xl font-bold tracking-tight inline-block"
              >
                {theme.siteTitle}
              </Link>
            )
          )}
          {mods.showTagline !== false && (
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              {theme.siteTagline}
            </p>
          )}
        </div>

        <nav
          style={{
            backgroundColor: effectiveNavBarBg,
            borderTop: `1px solid ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`,
          }}
          className="px-6 py-2.5"
        >
          <div className="mx-auto max-w-7xl flex items-center justify-center">
            {renderNavLinks()}
          </div>
        </nav>
      </header>
    );
  }

  // 4. CLASSIC BROADSHEET NEWSPAPER MASTHEAD (Default)
  return (
    <header
      style={{
        backgroundColor: effectiveHeaderBg,
        borderBottom: borderBottomCss,
      }}
      className={`transition-colors ${mods.stickyHeader ? "sticky top-0 z-40" : ""}`}
    >
      {renderTopBar()}

      {mods.showDateInHeader !== false && (
        <div
          style={{ borderColor: mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0") }}
          className="border-b px-6 py-1.5 text-[11px] uppercase tracking-widest text-slate-500"
        >
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <span>The Daily Record</span>
            <span>{formatDate(new Date())}</span>
            <span>Independent Bureau</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8 text-center">
        {mods.logoUrl ? (
          <img
            src={mods.logoUrl}
            alt="Logo"
            style={{ width: `${mods.logoWidth || 200}px` }}
            className="mx-auto"
          />
        ) : (
          mods.showSiteTitle !== false && (
            <Link
              href="/"
              style={{
                fontFamily: `${headingFont}, serif`,
                color: mods.headerTextColor || (isHeaderDark ? "#ffffff" : primaryColor),
                textTransform: mods.headingTransform || "none",
                fontWeight: mods.headingFontWeight || "900",
              }}
              className="text-4xl sm:text-6xl font-black tracking-tight block"
            >
              {theme.siteTitle}
            </Link>
          )
        )}
        {mods.showTagline !== false && (
          <p className="mt-2 text-xs font-serif italic text-slate-500">
            {theme.siteTagline}
          </p>
        )}
      </div>

      <nav
        style={{
          backgroundColor: effectiveNavBarBg,
          borderTop: `1px solid ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`,
        }}
        className="px-6 py-2.5"
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {renderNavLinks()}
          {mods.showSearchInNav !== false && (
            <div className={`pl-4 hidden sm:block ${isNavDark ? "text-slate-400" : "text-slate-500"}`}>
              <Search className="size-3.5" />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
