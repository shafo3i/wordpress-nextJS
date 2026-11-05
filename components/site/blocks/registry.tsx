"use client";

import React from "react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { HomepageBlock } from "@/lib/themes/homepage-types";

// Modular block imports
import { MagazineBentoBlock } from "./bento";
import { Broadsheet3ColBlock } from "./broadsheet";
import { HeroSliderBlock } from "./hero-slider";
import { HeadlineSliderBlock } from "./headline-slider";
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
import { FeaturedHeroSliderBlock } from "./featured-hero-slider";
import { BreakingTickerBlock } from "./breaking-ticker";
import { DualCategoryColumnsBlock } from "./dual-category";
import { CompactNumberedGridBlock } from "./compact-numbered";
import { SplitHeroFeatureBlock } from "./split-hero";
import { MultiCardCarouselBlock } from "./multi-carousel";

// Export all individual blocks for direct usage
export {
  MagazineBentoBlock,
  Broadsheet3ColBlock,
  HeroSliderBlock,
  FeaturedHeroSliderBlock,
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
  BreakingTickerBlock,
  DualCategoryColumnsBlock,
  CompactNumberedGridBlock,
  SplitHeroFeatureBlock,
  MultiCardCarouselBlock,
};

/**
 * Dispatches and renders any of the 12+ editorial blocks cleanly based on block.type and block.displayStyle
 */
export function renderEditorialBlock({
  block: rawBlock,
  posts,
  theme,
  preFiltered = false,
}: {
  block: HomepageBlock;
  posts: ContentItem[];
  theme: FrontEndThemeContext;
  preFiltered?: boolean;
}): React.ReactNode {
  if (!rawBlock.enabled) return null;

  const activeLocale = theme.locale || theme.defaultLocale || "en";
  const localizedTitle =
    (rawBlock.titles && rawBlock.titles[activeLocale]) ||
    rawBlock.title ||
    "";
  const localizedSubtitle =
    (rawBlock.subtitles && rawBlock.subtitles[activeLocale]) ||
    rawBlock.subtitle;

  const block: HomepageBlock = {
    ...rawBlock,
    title: rawBlock.showTitle === false ? "" : localizedTitle,
    subtitle: rawBlock.showTitle === false ? undefined : localizedSubtitle,
    linkText: rawBlock.showTitle === false ? undefined : rawBlock.linkText,
    linkHref: rawBlock.showTitle === false ? undefined : rawBlock.linkHref,
  };

  // Filter posts by category if specified
  const categoryFiltered =
    !preFiltered && block.categorySlug && block.categorySlug !== "all"
      ? posts.filter((p) =>
          p.categories.some(
            (c) => c.toLowerCase() === block.categorySlug!.toLowerCase()
          )
        )
      : posts;

  // Filter by featured posts if requested (with graceful fallback to categoryFiltered if none are marked yet)
  const shouldFilterFeatured = !preFiltered && (
    block.featuredOnly ||
    block.type === "featured_hero_slider" ||
    block.displayStyle === "featured_slider");

  const featuredMatches = shouldFilterFeatured
    ? categoryFiltered.filter((p) => p.isFeatured)
    : categoryFiltered;

  const displayPosts =
    featuredMatches.length > 0 ? featuredMatches : categoryFiltered;

  // 1. Style override takes highest priority if specified
  if (block.displayStyle) {
    switch (block.displayStyle) {
      case "headline_cover":
        return <HeadlineSliderBlock key={block.id} posts={displayPosts.slice(0, block.postCount || 5)} title={block.title} theme={theme} showDate={block.showDate} showCategory={block.showCategory} showAuthor={block.showAuthor} showExcerpt={block.showExcerpt} autoplay={block.autoplay} interval={block.rotationInterval} />;
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
            showColumnHeaders={block.showColumnHeaders}
            col1Title={block.col1Title}
            col2Title={block.col2Title}
            col3Title={block.col3Title}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
          />
        );

      case "featured_slider":
        return (
          <FeaturedHeroSliderBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 5)}
            title={block.title}
            theme={theme}
            showExcerpt={block.showExcerpt}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
          />
        );

      case "breaking_bar":
        return (
          <BreakingTickerBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 6)}
            title={block.title}
            theme={theme}
            showDate={block.showDate}
            showCategory={block.showCategory}
            autoplay={block.autoplay}
            interval={block.rotationInterval}
          />
        );

      case "dual_columns":
        return (
          <DualCategoryColumnsBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 6)}
            title={block.title}
            theme={theme}
            showExcerpt={block.showExcerpt}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
            col1Title={block.col1Title}
            col2Title={block.col2Title}
          />
        );

      case "numbered_strip":
        return (
          <CompactNumberedGridBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 5)}
            title={block.title}
            theme={theme}
            showDate={block.showDate}
            showCategory={block.showCategory}
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
          />
        );

      case "split_cover":
        return (
          <SplitHeroFeatureBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 4)}
            title={block.title}
            theme={theme}
            showExcerpt={block.showExcerpt}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
          />
        );

      case "cards_carousel":
        return (
          <MultiCardCarouselBlock
            key={block.id}
            posts={displayPosts.slice(0, block.postCount || 8)}
            title={block.title}
            theme={theme}
            showAuthor={block.showAuthor}
            showDate={block.showDate}
            showCategory={block.showCategory}
            subtitle={block.subtitle}
            linkText={block.linkText}
            linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
          showColumnHeaders={block.showColumnHeaders}
          col1Title={block.col1Title}
          col2Title={block.col2Title}
          col3Title={block.col3Title}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
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

    case "featured_hero_slider":
      return (
        <FeaturedHeroSliderBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 5)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
        />
      );

    case "headline_slider":
      return <HeadlineSliderBlock key={block.id} posts={displayPosts.slice(0, block.postCount || 5)} title={block.title} theme={theme} showDate={block.showDate} showCategory={block.showCategory} showAuthor={block.showAuthor} showExcerpt={block.showExcerpt} autoplay={block.autoplay} interval={block.rotationInterval} />;

    case "breaking_ticker":
      return (
        <BreakingTickerBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 6)}
          title={block.title}
          theme={theme}
          showDate={block.showDate}
          showCategory={block.showCategory}
          autoplay={block.autoplay}
          interval={block.rotationInterval}
        />
      );

    case "dual_category_columns":
      return (
        <DualCategoryColumnsBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 6)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
          col1Title={block.col1Title}
          col2Title={block.col2Title}
        />
      );

    case "compact_numbered_grid":
      return (
        <CompactNumberedGridBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 5)}
          title={block.title}
          theme={theme}
          showDate={block.showDate}
          showCategory={block.showCategory}
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
        />
      );

    case "split_hero_feature":
      return (
        <SplitHeroFeatureBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 4)}
          title={block.title}
          theme={theme}
          showExcerpt={block.showExcerpt}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
        />
      );

    case "multi_card_carousel":
      return (
        <MultiCardCarouselBlock
          key={block.id}
          posts={displayPosts.slice(0, block.postCount || 8)}
          title={block.title}
          theme={theme}
          showAuthor={block.showAuthor}
          showDate={block.showDate}
          showCategory={block.showCategory}
          subtitle={block.subtitle}
          linkText={block.linkText}
          linkHref={block.linkHref}
        />
      );

    default:
      return null;
  }
}
