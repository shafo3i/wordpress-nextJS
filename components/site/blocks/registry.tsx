"use client";

import React from "react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { HomepageBlock } from "@/lib/themes/homepage-types";

// Modular block imports
import { MagazineBentoBlock } from "./bento";
import { Broadsheet3ColBlock } from "./broadsheet";
import { HeroSliderBlock } from "./hero-slider";
import { BigLeadSideListBlock } from "./big-lead";
import { NewsListViewBlock } from "./news-list";
import { CardsGridBlock } from "./cards-grid";
import { VisualGridBlock } from "./visual-grid";
import { MinimalTextWireBlock } from "./minimal-text";
import { TabbedBlock } from "./tabbed";
import { TrendingBlock } from "./trending";
import { OpinionBlock } from "./opinion";
import { MultimediaBlock } from "./multimedia";
import { NewsletterBlock } from "./newsletter";
import { CategoryGridBlock } from "./category-grid";

// Export all individual blocks for direct usage
export {
  MagazineBentoBlock,
  Broadsheet3ColBlock,
  HeroSliderBlock,
  BigLeadSideListBlock,
  NewsListViewBlock,
  CardsGridBlock,
  VisualGridBlock,
  MinimalTextWireBlock,
  TabbedBlock,
  TrendingBlock,
  OpinionBlock,
  MultimediaBlock,
  NewsletterBlock,
  CategoryGridBlock,
};

/**
 * Dispatches and renders any of the 12+ editorial blocks cleanly based on block.type and block.displayStyle
 */
export function renderEditorialBlock({
  block,
  posts,
  theme,
}: {
  block: HomepageBlock;
  posts: ContentItem[];
  theme: FrontEndThemeContext;
}): React.ReactNode {
  if (!block.enabled) return null;

  // Filter posts by category if specified
  const filteredPosts =
    block.categorySlug && block.categorySlug !== "all"
      ? posts.filter((p) =>
          p.categories.some(
            (c) => c.toLowerCase() === block.categorySlug!.toLowerCase()
          )
        )
      : posts;

  const displayPosts = filteredPosts.length ? filteredPosts : posts;

  // 1. Style override takes highest priority if specified
  if (block.displayStyle) {
    switch (block.displayStyle) {
      case "bento":
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

      case "lead_side_list":
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

      case "lead_right_side_list":
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

      case "grid_3":
        return (
          <CardsGridBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 6)}
            title={block.title}
            theme={theme}
            columns={3}
            showExcerpt={block.showExcerpt}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
          />
        );

      case "grid_4":
        return (
          <CardsGridBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 8)}
            title={block.title}
            theme={theme}
            columns={4}
            showExcerpt={block.showExcerpt}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
          />
        );

      case "list_thumb_left":
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

      case "list_thumb_right":
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

      case "broadsheet_wire":
        return (
          <Broadsheet3ColBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 8)}
            title={block.title}
            theme={theme}
            showExcerpt={block.showExcerpt}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
          />
        );

      case "hero_slider":
        return (
          <HeroSliderBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 4)}
            title={block.title}
            theme={theme}
            showExcerpt={block.showExcerpt}
            showCategory={block.showCategory}
          />
        );

      case "overlay_cards":
        return (
          <VisualGridBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 6)}
            title={block.title}
            theme={theme}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
          />
        );

      case "minimal_text":
        return (
          <MinimalTextWireBlock
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
  }

  // 2. Block type dispatch
  switch (block.type) {
    case "magazine_bento":
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

    case "broadsheet_3col":
      return (
        <Broadsheet3ColBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 8)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );

    case "hero_slider":
      return (
        <HeroSliderBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showCategory={block.showCategory}
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
          reverse={false}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );

    case "news_list":
      return (
        <NewsListViewBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );

    case "visual_grid":
      return (
        <VisualGridBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 6)}
          title={block.title}
          theme={theme}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
        />
      );

    case "category_grid":
      return (
        <CardsGridBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 6)}
          title={block.title}
          theme={theme}
          columns={3}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
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

    case "trending":
      return (
        <TrendingBlock
          key={block.id}
          posts={displayPosts}
          title={block.title}
          theme={theme}
          postCount={block.postCount || 5}
        />
      );

    case "opinion":
      return (
        <OpinionBlock
          key={block.id}
          posts={displayPosts}
          title={block.title}
          theme={theme}
          postCount={block.postCount || 3}
        />
      );

    case "multimedia":
      return (
        <MultimediaBlock
          key={block.id}
          title={block.title}
          theme={theme}
        />
      );

    case "newsletter":
      return (
        <NewsletterBlock
          key={block.id}
          title={block.title}
          theme={theme}
        />
      );

    default:
      return null;
  }
}
