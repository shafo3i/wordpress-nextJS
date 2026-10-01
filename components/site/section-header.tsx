"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME } from "@/components/site/utils";

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
  const slug = theme.themeSlug || "";
  const isMag = slug.includes("magazine");
  const isClassic = slug.includes("classic") || slug.includes("broadsheet");
  const isDark = slug.includes("dark") || slug.includes("midnight") || theme.darkMode;
  const isSerif =
    theme.headingFont === "serif" ||
    slug.includes("classic") ||
    slug.includes("broadsheet") ||
    slug.includes("reader") ||
    slug.includes("longform");

  if (isClassic) {
    return (
      <div
        style={{ borderColor: "var(--theme-border, #0f172a)" }}
        className="border-b-4 border-double pb-2 mb-6 flex items-baseline justify-between transition-colors"
      >
        <div>
          <h2
            style={{ color: "var(--theme-heading, #0f172a)" }}
            className="text-2xl font-serif font-black uppercase tracking-tight"
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{ color: "var(--theme-muted, #64748b)" }}
              className="text-[11px] uppercase tracking-widest font-mono mt-0.5"
            >
              {subtitle}
            </p>
          )}
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            style={{ color: "var(--theme-primary, #2271b1)" }}
            className="text-xs font-serif font-bold uppercase tracking-wider hover:underline"
          >
            {linkText} →
          </Link>
        )}
      </div>
    );
  }

  if (isMag) {
    return (
      <div
        style={{ borderColor: "var(--theme-border, #e2e8f0)" }}
        className="relative border-b pb-3 mb-6 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            style={{ backgroundColor: "var(--theme-primary, #2271b1)" }}
            className="w-2.5 h-6 rounded-sm block"
          />
          <h2
            style={{ color: "var(--theme-heading, #0f172a)" }}
            className="text-xl sm:text-2xl font-sans font-black uppercase tracking-tight"
          >
            {title}
          </h2>
          {subtitle && (
            <span
              style={{
                backgroundColor: "var(--theme-badge-bg, #e11d48)",
                color: "var(--theme-badge-text, #ffffff)",
              }}
              className="hidden sm:inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs"
            >
              {subtitle}
            </span>
          )}
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            style={{ color: "var(--theme-primary, #2271b1)" }}
            className="text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
          >
            {linkText} <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
    );
  }

  if (isDark) {
    return (
      <div
        style={{ borderColor: "var(--theme-border, #1f2937)" }}
        className="border-b pb-2.5 mb-6 flex items-center justify-between font-mono transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            style={{ backgroundColor: "var(--theme-primary, #10b981)" }}
            className="size-2 rounded-full animate-ping"
          />
          <h2
            style={{ color: "var(--theme-heading, #f8fafc)" }}
            className="text-lg font-bold tracking-wider uppercase"
          >
            {title}
          </h2>
          {subtitle && (
            <span
              style={{ color: "var(--theme-muted, #94a3b8)" }}
              className="text-xs"
            >
              [{subtitle}]
            </span>
          )}
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            style={{ color: "var(--theme-primary, #10b981)" }}
            className="text-xs hover:underline uppercase tracking-wider"
          >
            {linkText} //
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ borderColor: "var(--theme-border, #d6d3d1)" }}
      className="border-b pb-2 mb-6 flex items-baseline justify-between transition-colors"
    >
      <div>
        <h2
          style={{ color: "var(--theme-heading, #1c1917)" }}
          className={`text-xl font-bold tracking-tight ${isSerif ? "font-serif" : "font-sans"}`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{ color: "var(--theme-muted, #78716c)" }}
            className="text-xs mt-0.5"
          >
            {subtitle}
          </p>
        )}
      </div>
      {linkText && linkHref && (
        <Link
          href={linkHref}
          style={{ color: "var(--theme-primary, #2271b1)" }}
          className="text-xs font-serif italic hover:underline"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}
