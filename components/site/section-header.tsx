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
      <div className="border-b-4 border-double border-slate-900 dark:border-slate-300 pb-2 mb-6 flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-serif font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            style={{ color: theme.primaryColor }}
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
      <div className="relative border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            style={{ backgroundColor: theme.primaryColor }}
            className="w-2.5 h-6 rounded-sm block"
          />
          <h2 className="text-xl sm:text-2xl font-sans font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <span className="hidden sm:inline-block rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            style={{ color: theme.primaryColor }}
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
      <div className="border-b border-slate-800 pb-2.5 mb-6 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <h2 className="text-lg font-bold text-white tracking-wider uppercase">
            {title}
          </h2>
          {subtitle && <span className="text-xs text-slate-500">[{subtitle}]</span>}
        </div>
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="text-xs text-emerald-400 hover:underline uppercase tracking-wider"
          >
            {linkText} //
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-stone-300 pb-2 mb-6 flex items-baseline justify-between">
      <div>
        <h2 className={`text-xl font-bold tracking-tight text-stone-900 ${isSerif ? "font-serif" : "font-sans"}`}>
          {title}
        </h2>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {linkText && linkHref && (
        <Link href={linkHref} className="text-xs font-serif italic text-stone-600 hover:underline">
          {linkText} →
        </Link>
      )}
    </div>
  );
}
