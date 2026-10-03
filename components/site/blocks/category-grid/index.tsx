"use client";

import { CardsGridBlock } from "../cards-grid";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import { DEFAULT_THEME } from "@/components/site/utils";

/**
 * 7. CATEGORY STORY HIGHLIGHTS (Filtered Category Grid)
 */
export function CategoryGridBlock({
  posts,
  title,
  theme = DEFAULT_THEME,
  showExcerpt = true,
  showAuthor = true,
  showDate = true,
  showCategory = true,
  subtitle,
  linkText,
  linkHref,
}: {
  posts: ContentItem[];
  title: string;
  theme?: FrontEndThemeContext;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
}) {
  return (
    <CardsGridBlock
      posts={posts}
      title={title}
      theme={theme}
      columns={3}
      showExcerpt={showExcerpt}
      showAuthor={showAuthor}
      showDate={showDate}
      showCategory={showCategory}
      subtitle={subtitle}
      linkText={linkText}
      linkHref={linkHref}
    />
  );
}
