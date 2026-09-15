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
import {
  MagazineBentoBlock,
  Broadsheet3ColBlock,
  HeroSliderBlock,
  BigLeadSideListBlock,
  NewsListViewBlock,
  CardsGridBlock,
  VisualGridBlock,
  MinimalTextWireBlock,
  TabbedBlock,
  MultimediaBlock,
} from "@/components/site/blocks/editorial-blocks";
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
}: {
  posts: ContentItem[];
  theme?: FrontEndThemeContext;
  blocks?: HomepageBlock[];
  settings?: HomepageSettings;
  primarySidebar?: WidgetItem[];
  secondarySidebar?: WidgetItem[];
}) {
  const isDark = theme.darkMode || theme.themeSlug === "ledger-dark";
  const isSerif =
    theme.headingFont === "serif" ||
    theme.themeSlug === "ledger-classic" ||
    theme.themeSlug === "ledger-reader";

  const activeLayout = settings?.layout || "right_sidebar";
  const rawBlocks = settings?.blocks || blocks || [];
  const activeBlocks = rawBlocks.filter((b) => b.enabled);

  // Render an editorial block according to user-selected displayStyle
  const renderBlock = (block: HomepageBlock) => {
    const filteredPosts =
      block.categorySlug && block.categorySlug !== "all"
        ? posts.filter((p) =>
            p.categories.some(
              (c) => c.toLowerCase() === block.categorySlug!.toLowerCase()
            )
          )
        : posts;

    const displayPosts = filteredPosts.length ? filteredPosts : posts;
    const style = block.displayStyle;

    // Direct display style overrides
    if (style === "bento") {
      return (
        <MagazineBentoBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 5)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "broadsheet_wire") {
      return (
        <Broadsheet3ColBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 6)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "hero_slider") {
      return (
        <HeroSliderBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 5)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "lead_side_list") {
      return (
        <BigLeadSideListBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          reverse={false}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "lead_right_side_list") {
      return (
        <BigLeadSideListBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          reverse={true}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "grid_3") {
      return (
        <CardsGridBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 3)}
          title={block.title}
          theme={theme}
          columns={3}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "grid_4") {
      return (
        <CardsGridBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          columns={4}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "list_thumb_left") {
      return (
        <NewsListViewBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          thumbRight={false}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "list_thumb_right") {
      return (
        <NewsListViewBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          thumbRight={true}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "overlay_cards") {
      return (
        <VisualGridBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 3)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    if (style === "minimal_text") {
      return (
        <MinimalTextWireBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 5)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );
    }

    // Default block types fallback
    switch (block.type) {
      case "magazine_bento":
        return (
          <MagazineBentoBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 5)}
            title={block.title}
            theme={theme}
          />
        );

      case "broadsheet_3col":
        return (
          <Broadsheet3ColBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 6)}
            title={block.title}
            theme={theme}
          />
        );

      case "hero_slider":
        return (
          <HeroSliderBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 5)}
            title={block.title}
            theme={theme}
          />
        );

      case "big_lead_side_list":
      case "hero":
        return (
          <BigLeadSideListBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 4)}
            title={block.title}
            theme={theme}
          />
        );

      case "news_list":
        return (
          <NewsListViewBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 4)}
            title={block.title}
            theme={theme}
          />
        );

      case "visual_grid":
        return (
          <VisualGridBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 3)}
            title={block.title}
            theme={theme}
          />
        );

      case "tabbed_block":
        return (
          <TabbedBlock
            key={block.id}
            posts={displayPosts}
            title={block.title}
            theme={theme}
          />
        );

      case "trending": {
        const trendingItems = displayPosts.slice(0, block.postCount || 5);
        return (
          <section
            key={block.id}
            className={`rounded-2xl border p-5 ${
              isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame className="size-4 text-rose-500" />
              <h3 className={`text-base font-bold uppercase tracking-wider ${isSerif ? "font-serif" : "font-sans"}`}>
                {block.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60 dark:divide-slate-800">
              {trendingItems.map((item, idx) => (
                <div key={item.id} className="pt-3 sm:pt-0 sm:px-3 first:pl-0 last:pr-0">
                  <span
                    style={{ color: theme.primaryColor }}
                    className="font-mono text-xl font-black block leading-none mb-1.5"
                  >
                    0{idx + 1}
                  </span>
                  <Link href={`/posts/${item.slug}`} className="block hover:underline">
                    <h4 className="text-xs font-bold leading-snug line-clamp-3">{item.title}</h4>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "opinion": {
        const opinionItems = displayPosts.slice(0, block.postCount || 3);
        return (
          <section key={block.id} className="space-y-4">
            <ThemeSectionHeader
              title={block.title}
              subtitle="Commentary"
              theme={theme}
            />
            <div className="grid gap-6 md:grid-cols-3">
              {opinionItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 shadow-sm ${
                    isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-[#faf8f5]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                      {item.authorName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">{item.authorName}</span>
                      <span className="text-[10px] text-slate-400">Newsroom Columnist</span>
                    </div>
                  </div>
                  <Link href={`/posts/${item.slug}`} className="hover:underline">
                    <h4 className="font-serif text-base font-bold leading-snug">"{item.title}"</h4>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "multimedia":
        return <MultimediaBlock key={block.id} title={block.title} theme={theme} />;

      case "newsletter":
        return (
          <section
            key={block.id}
            className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-md text-center"
          >
            <span className="text-2xl">✉️</span>
            <h3 className="text-2xl font-bold font-serif mt-2 mb-1">{block.title}</h3>
            <p className="text-xs text-slate-300 max-w-lg mx-auto mb-5 leading-relaxed">
              Delivering essential morning intelligence, editorial analysis, and business reports straight to your inbox before markets open.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you for subscribing to the Daily Briefing!");
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                required
                className="px-4 py-2 text-xs bg-slate-800 border border-slate-700 rounded text-white focus:outline-none flex-1"
              />
              <button
                type="submit"
                style={{ backgroundColor: theme.primaryColor }}
                className="px-5 py-2 text-xs font-bold text-white rounded hover:opacity-90 transition-opacity"
              >
                Subscribe
              </button>
            </form>
          </section>
        );

      default:
        return null;
    }
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
      className={`min-h-screen transition-colors ${
        isDark
          ? "bg-[#0a0f1d] text-slate-100"
          : theme.themeSlug === "ledger-reader"
          ? "bg-[#fbf9f5] text-stone-900"
          : "bg-[#f8f7f4] text-slate-900"
      }`}
    >
      {theme.mods && <ThemeDynamicStyles mods={theme.mods} />}
      <SiteHeader theme={theme} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {activeLayout === "full_width" && (
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
        )}

        {activeLayout === "right_sidebar" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
            <div className="space-y-12 min-w-0">
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

      <SiteFooter theme={theme} />
    </div>
  );
}
