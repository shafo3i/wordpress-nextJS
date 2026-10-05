"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME, localizePath } from "@/components/site/utils";

export function ThemeSectionHeader({
  title,
  subtitle,
  linkText,
  linkHref,
  theme = DEFAULT_THEME,
}: {
  title: string;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
  theme?: FrontEndThemeContext;
}) {
  const isRtl = theme.direction === "rtl";
  const displayTitle = title ? (theme.dict?.[title] || theme.dict?.[`site.${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`] || title) : "";
  const displaySubtitle = subtitle ? (theme.dict?.[subtitle] || theme.dict?.[`site.${subtitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`] || subtitle) : undefined;
  const displayLinkText = linkText ? (theme.dict?.[linkText] || theme.dict?.[`site.${linkText.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`] || linkText) : undefined;
  const effectiveLinkHref = linkHref ? localizePath(linkHref, theme.locale, theme.defaultLocale) : undefined;
  const arrowChar = isRtl ? "←" : "→";

  const style = theme.sectionStyle;
  const isClassic = style === "classic";
  const isMag = style === "magazine";
  const isTerminal = style === "terminal";
  const isSerif = theme.headingFont === "serif";

  if (isClassic) {
    return (
      <div
        style={{ borderColor: "var(--theme-border)" }}
        className="border-b-4 border-double pb-2 mb-6 flex items-baseline justify-between transition-colors"
      >
        <div>
          <h2
            style={{ color: "var(--theme-heading)" }}
            className="text-2xl font-serif font-black uppercase tracking-tight"
          >
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p
              style={{ color: "var(--theme-muted)" }}
              className="text-[0.6875rem] uppercase tracking-widest font-mono mt-0.5"
            >
              {displaySubtitle}
            </p>
          )}
        </div>
        {displayLinkText && effectiveLinkHref && (
          <Link
            href={effectiveLinkHref}
            style={{ color: "var(--theme-primary)" }}
            className="text-xs font-serif font-bold uppercase tracking-wider hover:underline"
          >
            {displayLinkText} {arrowChar}
          </Link>
        )}
      </div>
    );
  }

  if (isMag) {
    return (
      <div
        style={{ borderColor: "var(--theme-border)" }}
        className="relative border-b pb-3 mb-6 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            style={{ backgroundColor: "var(--theme-primary)" }}
            className="w-2.5 h-6 rounded-sm block"
          />
          <h2
            style={{ color: "var(--theme-heading)" }}
            className="text-xl sm:text-2xl font-sans font-black uppercase tracking-tight"
          >
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <span
              style={{
                backgroundColor: "var(--theme-badge-bg)",
                color: "var(--theme-badge-text)",
              }}
              className="hidden sm:inline-block rounded-full px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider shadow-xs"
            >
              {displaySubtitle}
            </span>
          )}
        </div>
        {displayLinkText && effectiveLinkHref && (
          <Link
            href={effectiveLinkHref}
            style={{ color: "var(--theme-primary)" }}
            className="text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
          >
            {displayLinkText} <ArrowRight className={`size-3 ${isRtl ? "rotate-180" : ""}`} />
          </Link>
        )}
      </div>
    );
  }

  if (isTerminal) {
    return (
      <div
        style={{ borderColor: "var(--theme-border)" }}
        className="border-b pb-2.5 mb-6 flex items-center justify-between font-mono transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            style={{ backgroundColor: "var(--theme-primary)" }}
            className="size-2 rounded-full animate-ping"
          />
          <h2
            style={{ color: "var(--theme-heading)" }}
            className="text-lg font-bold tracking-wider uppercase"
          >
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <span
              style={{ color: "var(--theme-muted)" }}
              className="text-xs"
            >
              [{displaySubtitle}]
            </span>
          )}
        </div>
        {displayLinkText && effectiveLinkHref && (
          <Link
            href={effectiveLinkHref}
            style={{ color: "var(--theme-primary)" }}
            className="text-xs hover:underline uppercase tracking-wider"
          >
            {displayLinkText} //
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ borderColor: "var(--theme-border)" }}
      className="border-b pb-2 mb-6 flex items-baseline justify-between transition-colors"
    >
      <div>
        <h2
          style={{ color: "var(--theme-heading)" }}
          className={`text-xl font-bold tracking-tight ${isSerif ? "font-serif" : "font-sans"}`}
        >
          {displayTitle}
        </h2>
        {displaySubtitle && (
          <p
            style={{ color: "var(--theme-muted)" }}
            className="text-xs mt-0.5"
          >
            {displaySubtitle}
          </p>
        )}
      </div>
      {displayLinkText && effectiveLinkHref && (
        <Link
          href={effectiveLinkHref}
          style={{ color: "var(--theme-primary)" }}
          className="text-xs font-serif italic hover:underline"
        >
          {displayLinkText} {arrowChar}
        </Link>
      )}
    </div>
  );
}
