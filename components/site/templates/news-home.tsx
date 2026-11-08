"use client";

import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { HomepageBlock, HomepageSettings } from "@/lib/themes/homepage-types";
import type { WidgetItem } from "@/lib/widgets/db";
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles";
import { SiteHeader } from "@/components/site/header/site-header";
import { SiteFooter } from "@/components/site/footer/site-footer";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import React from "react";
import { renderEditorialBlock } from "@/components/site/blocks/registry";
import { BuilderSectionRenderer } from "@/components/site/builder";
import { getHomepageLayoutStyle } from "@/lib/themes/homepage-layout";
import { DEFAULT_THEME } from "@/components/site/utils";

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
    col4?: WidgetItem[];
  };
}) {
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
        {activeBlocks.map(renderBlock)}
      </div>
    );
  };

  const activeLocale = theme?.locale || theme?.defaultLocale || "en";
  const visiblePrimary = (primarySidebar || []).filter(
    (item) => !item.locale || item.locale === "all" || item.locale === activeLocale
  );
  const visibleSecondary = (secondarySidebar || []).filter(
    (item) => !item.locale || item.locale === "all" || item.locale === activeLocale
  );
  const hasPrimary = visiblePrimary.length > 0;
  const hasSecondary = visibleSecondary.length > 0;

  const renderSidebar = (items: WidgetItem[]) => {
    const visibleItems = items.filter(
      (item) => !item.locale || item.locale === "all" || item.locale === activeLocale
    );

    if (!visibleItems.length) {
      return null;
    }

    return (
      <div className="space-y-6">
        {visibleItems.map((item) => (
          <SidebarWidgetRenderer key={item.id} item={item} theme={theme} posts={posts} />
        ))}
      </div>
    );
  };

  return (
    <div
      style={getHomepageLayoutStyle(settings)}
      dir={theme.direction || "ltr"}
      lang={theme.locale || "en"}
      className="min-h-screen transition-colors bg-theme-bg text-theme-text"
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />}
      <SiteHeader theme={theme} />

      {hasSections ? (
        /* Dynamic Multi-Section Page Builder Layout */
        <main className="w-full min-h-[60vh] pb-12">
          {(!hasPrimary && !hasSecondary) || activeLayout === "full_width" ? (
            renderContent()
          ) : activeLayout === "right_sidebar" ? (
            hasPrimary ? (
              <div dir="ltr" className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,min(var(--feed-sidebar-width,320px),35%))] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <div dir={theme.direction || "ltr"} className="min-w-0">{renderContent()}</div>
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6">
                  {renderSidebar(primarySidebar)}
                </aside>
              </div>
            ) : (
              <div className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</div>
            )
          ) : activeLayout === "left_sidebar" ? (
            hasPrimary ? (
              <div dir="ltr" className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,min(var(--feed-sidebar-width,320px),35%))_minmax(0,1fr)] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-2 lg:order-1">
                  {renderSidebar(primarySidebar)}
                </aside>
                <div dir={theme.direction || "ltr"} className="min-w-0 order-1 lg:order-2">{renderContent()}</div>
              </div>
            ) : (
              <div className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</div>
            )
          ) : activeLayout === "dual_sidebar" ? (
            hasPrimary && hasSecondary ? (
              <div dir="ltr" className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,min(var(--feed-sidebar-width,260px),25%))_minmax(0,1fr)_minmax(0,min(var(--feed-sidebar-width,300px),25%))] gap-[var(--feed-column-gap,2rem)] items-start">
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-2 lg:order-1">
                  {renderSidebar(secondarySidebar)}
                </aside>
                <div dir={theme.direction || "ltr"} className="min-w-0 order-1 lg:order-2">{renderContent()}</div>
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-3 lg:order-3">
                  {renderSidebar(primarySidebar)}
                </aside>
              </div>
            ) : hasPrimary ? (
              <div dir="ltr" className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,min(var(--feed-sidebar-width,320px),35%))] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <div dir={theme.direction || "ltr"} className="min-w-0">{renderContent()}</div>
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6">
                  {renderSidebar(primarySidebar)}
                </aside>
              </div>
            ) : hasSecondary ? (
              <div dir="ltr" className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,min(var(--feed-sidebar-width,320px),35%))_minmax(0,1fr)] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-2 lg:order-1">
                  {renderSidebar(secondarySidebar)}
                </aside>
                <div dir={theme.direction || "ltr"} className="min-w-0 order-1 lg:order-2">{renderContent()}</div>
              </div>
            ) : (
              <div className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</div>
            )
          ) : (
            renderContent()
          )}
        </main>
      ) : (
        /* Flat Editorial Blocks Layout */
        <main className="theme-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {(!hasPrimary && !hasSecondary) || activeLayout === "full_width" ? (
            renderContent()
          ) : activeLayout === "right_sidebar" ? (
            hasPrimary ? (
              <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,min(var(--feed-sidebar-width,320px),35%))] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <div dir={theme.direction || "ltr"} className="min-w-0">{renderContent()}</div>
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6">
                  {renderSidebar(primarySidebar)}
                </aside>
              </div>
            ) : (
              renderContent()
            )
          ) : activeLayout === "left_sidebar" ? (
            hasPrimary ? (
              <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-[minmax(0,min(var(--feed-sidebar-width,320px),35%))_minmax(0,1fr)] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-2 lg:order-1">
                  {renderSidebar(primarySidebar)}
                </aside>
                <div className="space-y-12 min-w-0 order-1 lg:order-2">
                  {renderContent()}
                </div>
              </div>
            ) : (
              renderContent()
            )
          ) : activeLayout === "dual_sidebar" ? (
            hasPrimary && hasSecondary ? (
              <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-[minmax(0,min(var(--feed-sidebar-width,260px),25%))_minmax(0,1fr)_minmax(0,min(var(--feed-sidebar-width,300px),25%))] gap-[var(--feed-column-gap,2rem)] items-start">
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-2 lg:order-1">
                  {renderSidebar(secondarySidebar)}
                </aside>
                <div className="space-y-12 min-w-0 order-1 lg:order-2">
                  {renderContent()}
                </div>
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-3 lg:order-3">
                  {renderSidebar(primarySidebar)}
                </aside>
              </div>
            ) : hasPrimary ? (
              <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,min(var(--feed-sidebar-width,320px),35%))] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <div dir={theme.direction || "ltr"} className="min-w-0">{renderContent()}</div>
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6">
                  {renderSidebar(primarySidebar)}
                </aside>
              </div>
            ) : hasSecondary ? (
              <div dir="ltr" className="grid grid-cols-1 lg:grid-cols-[minmax(0,min(var(--feed-sidebar-width,320px),35%))_minmax(0,1fr)] gap-[var(--feed-column-gap,2.5rem)] items-start">
                <aside dir={theme.direction || "ltr"} className="space-y-6 lg:[position:var(--feed-sidebar-position,sticky)] lg:top-6 order-2 lg:order-1">
                  {renderSidebar(secondarySidebar)}
                </aside>
                <div className="space-y-12 min-w-0 order-1 lg:order-2">
                  {renderContent()}
                </div>
              </div>
            ) : (
              renderContent()
            )
          ) : (
            renderContent()
          )}
        </main>
      )}

      <SiteFooter theme={theme} footerWidgets={footerWidgets} />
    </div>
  );
}
