"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { HomepageBlock, HomepageSettings } from "@/lib/themes/homepage-types";
import type { WidgetItem } from "@/lib/widgets/db";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { ThemeSectionHeader } from "@/components/site/section-header";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import React from "react";
import { renderEditorialBlock } from "@/components/site/blocks/registry";
import { BuilderSectionRenderer } from "@/components/site/builder";
import { DEFAULT_THEME, isSerifHeading, isDarkTheme } from "@/components/site/utils";

/**
 * Main Front-page News Layout Component
 */
export function NewsHome({
  posts,
  theme = DEFAULT_THEME,
  blocks,
  settings,
  primarySidebar = [],
  secondarySidebar = [],
  footerWidgets,
}: {
  posts: ContentItem[];
  theme?: FrontEndThemeContext;
  blocks?: HomepageBlock[];
  settings?: HomepageSettings;
  primarySidebar?: WidgetItem[];
  secondarySidebar?: WidgetItem[];
  footerWidgets?: {
    col1?: WidgetItem[];
    col2?: WidgetItem[];
    col3?: WidgetItem[];
  };
}) {
  const isDark = isDarkTheme(theme);
  const isSerif = isSerifHeading(theme);

  const activeLayout = settings?.layout || "right_sidebar";
  const rawBlocks = settings?.blocks || blocks || [];
  const activeBlocks = rawBlocks.filter((b) => b.enabled);

  // Render an editorial block according to user-selected displayStyle
  const renderBlock = (block: HomepageBlock) => {
    return (
      <React.Fragment key={block.id}>
        {renderEditorialBlock({ block, posts, theme })}
      </React.Fragment>
    );
  };

  const sections = settings?.sections;
  const hasSections = Array.isArray(sections) && sections.length > 0;

  const renderContent = () => {
    if (hasSections) {
      return (
        <div className="space-y-12">
          {sections.map((sec) => (
            <BuilderSectionRenderer
              key={sec.id}
              section={sec}
              posts={posts}
              theme={theme}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-12">
        {activeBlocks.length > 0
          ? activeBlocks.map(renderBlock)
          : renderBlock({
            id: "default-bento",
            type: "magazine_bento",
            title: "Top Stories",
            enabled: true,
            order: 1,
          })}
      </div>
    );
  };

  const renderSidebar = (items: WidgetItem[]) => {
    if (!items.length) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-4 text-center text-xs text-slate-400">
          No widgets placed in this sidebar yet.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {items.map((item) => (
          <SidebarWidgetRenderer key={item.id} item={item} theme={theme} posts={posts} />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen transition-colors ${isDark
        ? "bg-[#0a0f1d] text-slate-100"
        : (theme.themeSlug?.includes("reader") || theme.themeSlug?.includes("longform"))
          ? "bg-[#fbf9f5] text-stone-900"
          : "bg-[#f8f7f4] text-slate-900"
        }`}
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} />}
      <SiteHeader theme={theme} />

      {hasSections ? (
        /* Dynamic Multi-Section Page Builder Layout */
        <main className="w-full min-h-[60vh] pb-12">
          {activeLayout === "full_width" && renderContent()}

          {activeLayout === "right_sidebar" && (
            <div className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
              <div className="min-w-0">{renderContent()}</div>
              <aside className="space-y-6 lg:sticky lg:top-6">
                {renderSidebar(primarySidebar)}
              </aside>
            </div>
          )}

          {activeLayout === "left_sidebar" && (
            <div className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 items-start">
              <aside className="space-y-6 lg:sticky lg:top-6 order-2 lg:order-1">
                {renderSidebar(primarySidebar)}
              </aside>
              <div className="min-w-0 order-1 lg:order-2">{renderContent()}</div>
            </div>
          )}

          {activeLayout === "dual_sidebar" && (
            <div className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-8 items-start">
              <aside className="space-y-6 lg:sticky lg:top-6 order-2 lg:order-1">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Left Column
                  </span>
                </div>
                {renderSidebar(secondarySidebar)}
              </aside>

              <div className="min-w-0 order-1 lg:order-2">{renderContent()}</div>

              <aside className="space-y-6 lg:sticky lg:top-6 order-3 lg:order-3">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Right Column
                  </span>
                </div>
                {renderSidebar(primarySidebar)}
              </aside>
            </div>
          )}
        </main>
      ) : (
        /* Flat Editorial Blocks Layout */
        <main className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeLayout === "full_width" && renderContent()}

          {activeLayout === "right_sidebar" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
              <div className="min-w-0">{renderContent()}</div>
              <aside className="space-y-6 lg:sticky lg:top-6">
                {renderSidebar(primarySidebar)}
              </aside>
            </div>
          )}

          {activeLayout === "left_sidebar" && (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 items-start">
              <aside className="space-y-6 lg:sticky lg:top-6 order-2 lg:order-1">
                {renderSidebar(primarySidebar)}
              </aside>
              <div className="space-y-12 min-w-0 order-1 lg:order-2">
                {activeBlocks.length > 0 ? activeBlocks.map(renderBlock) : null}
              </div>
            </div>
          )}

          {activeLayout === "dual_sidebar" && (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-8 items-start">
              <aside className="space-y-6 lg:sticky lg:top-6 order-2 lg:order-1">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Left Column
                  </span>
                </div>
                {renderSidebar(secondarySidebar)}
              </aside>

              <div className="space-y-12 min-w-0 order-1 lg:order-2">
                {activeBlocks.length > 0 ? activeBlocks.map(renderBlock) : null}
              </div>

              <aside className="space-y-6 lg:sticky lg:top-6 order-3 lg:order-3">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Right Column
                  </span>
                </div>
                {renderSidebar(primarySidebar)}
              </aside>
            </div>
          )}
        </main>
      )}

      <SiteFooter theme={theme} footerWidgets={footerWidgets} />
    </div>
  );
}
