"use client";

import React from "react";
import type { BuilderItem } from "@/lib/themes/homepage-types";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { ContentItem } from "@/lib/site-content";
import { renderEditorialBlock } from "@/components/site/blocks/registry";
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer";
import type { WidgetItem } from "@/widgets/types";

interface BuilderItemRendererProps {
  item: BuilderItem;
  posts: ContentItem[];
  theme: FrontEndThemeContext;
}

export function BuilderItemRenderer({ item, posts, theme }: BuilderItemRendererProps) {
  if (item.type === "block" && item.block) {
    return (
      <div key={item.id} className="w-full">
        {renderEditorialBlock({ block: item.block, posts, theme })}
      </div>
    );
  }

  if (item.type === "widget" && item.widgetId) {
    const activeLocale = theme?.locale || theme?.defaultLocale || "en";
    const widgetLocale = item.locale || item.config?.locale || "all";

    // If assigned to a specific language, only show when that language is active
    if (widgetLocale !== "all" && widgetLocale !== activeLocale) {
      return null;
    }

    const widgetItem: WidgetItem = {
      id: item.id,
      type: item.widgetId,
      title: item.title || "",
      content: item.config?.content,
      count: item.config?.count,
      displayStyle: item.config?.displayStyle,
      config: item.config,
      locale: widgetLocale,
    };
    return (
      <div key={item.id} className="w-full">
        <SidebarWidgetRenderer item={widgetItem} theme={theme} posts={posts} />
      </div>
    );
  }

  return null;
}
