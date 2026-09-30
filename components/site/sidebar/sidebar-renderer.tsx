"use client";

import React from "react";
import type { WidgetItem } from "@/widgets/types";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { ContentItem } from "@/lib/site-content";
import { DEFAULT_THEME } from "@/components/site/utils";
import { getWidget } from "@/widgets/registry";

interface SidebarWidgetRendererProps {
  item: WidgetItem;
  theme?: FrontEndThemeContext;
  posts?: ContentItem[];
}

export function SidebarWidgetRenderer({
  item,
  theme = DEFAULT_THEME,
  posts = [],
}: SidebarWidgetRendererProps) {
  const widget = getWidget(item.type);

  if (!widget || !widget.render) {
    return null;
  }

  const RenderComponent = widget.render;
  return <RenderComponent item={item} theme={theme} posts={posts} />;
}
