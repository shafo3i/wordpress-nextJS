"use client";

import Link from "next/link";
import { Search, Clock, Share2, ArrowRight } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { getFontFamilyCss } from "@/components/site/theme-dynamic-styles";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export function SiteHeader({ theme }: { theme: FrontEndThemeContext }) {
  const mods = theme.mods || {};
  const isDark = theme.darkMode;
  const isSerif =
    (mods.headingFont || theme.headingFont) === "serif" ||
    theme.themeSlug === "ledger-classic" ||
    theme.themeSlug === "ledger-reader";

  const headingFont = getFontFamilyCss(
    mods.headingFontFamily,
    isSerif ? "serif" : "sans"
  );

  const headerLayout = mods.headerLayout || theme.headerLayout || "classic";
  const primaryColor = mods.primaryColor || theme.primaryColor || "#2271b1";
  const borderStyle = mods.headerBorderStyle || (theme.themeSlug === "ledger-magazine" ? "none" : "double");

  const borderBottomCss =
    borderStyle === "double"
      ? `4px double ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`
      : borderStyle === "solid"
      ? `1px solid ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`
      : "none";

  // Top Bar Ticker & Utility
  const renderTopBar = () => {
    if (mods.showTopBar === false) return null;

    return (
      <div
        style={{
          backgroundColor: mods.topBarBg || (isDark ? "#030712" : headerLayout === "magazine" ? primaryColor : "#0f172a"),
          color: mods.topBarTextColor || "#f8fafc",
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
        className={`flex flex-wrap items-center gap-4 sm:gap-6 w-full ${
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

          return (
            <Link
              key={item.id}
              href={item.url}
              style={{
                color: idx === 0 ? primaryColor : mods.navLinkColor,
                textTransform: mods.navUppercase ? "uppercase" : "none",
              }}
              className={`text-xs font-bold tracking-wider transition-colors whitespace-nowrap ${
                isPill
                  ? "px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  : isUnderlined && idx === 0
                  ? "border-b-2 pb-0.5 border-[#2271b1]"
                  : "hover:opacity-80"
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
          backgroundColor: mods.headerBg || (isDark ? "#020617" : "#ffffff"),
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
                      color: mods.headerTextColor || (isDark ? "#ffffff" : primaryColor),
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
            backgroundColor: mods.navBarBg || (isDark ? "#0f172a" : "#0f172a"),
            color: mods.navLinkColor || "#f8fafc",
          }}
          className="border-t border-slate-800"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {renderNavLinks()}
            {mods.showSearchInNav !== false && (
              <div className="pl-4 text-slate-400 hidden sm:block">
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
          backgroundColor: mods.headerBg || (isDark ? "#0a0f1d" : "#ffffff"),
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
                  color: mods.headerTextColor || (isDark ? "#ffffff" : primaryColor),
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
            backgroundColor: mods.navBarBg || (isDark ? "#0f172a" : "#ffffff"),
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
        backgroundColor: mods.headerBg || (isDark ? "#0a0f1d" : "#f8f7f4"),
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
                color: mods.headerTextColor || (isDark ? "#ffffff" : primaryColor),
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
          backgroundColor: mods.navBarBg || (isDark ? "#0f172a" : "#ffffff"),
          borderTop: `1px solid ${mods.borderColor || (isDark ? "#1f2937" : "#e2e8f0")}`,
        }}
        className="px-6 py-2.5"
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {renderNavLinks()}
          {mods.showSearchInNav !== false && (
            <div className="pl-4 text-slate-400 hidden sm:block">
              <Search className="size-3.5" />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
