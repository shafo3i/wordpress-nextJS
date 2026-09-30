import type { ComponentType } from "react";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { ContentItem } from "@/lib/site-content";

export type WidgetDisplayStyle = "list" | "card" | "compact" | "numbered";
export type WidgetType = string;

export interface WidgetManifest {
  id: string;
  name: string;
  description: string;
  category: "core" | "plugin";
  pluginSlug?: string;
  defaultTitle: string;
  defaultContent?: string;
}

export interface WidgetItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  count?: number;
  pluginSlug?: string;
  displayStyle?: WidgetDisplayStyle;
  showThumbnail?: boolean;
  showDate?: boolean;
  showExcerpt?: boolean;
  config?: Record<string, any>;
}

export interface WidgetArea {
  id: string;
  title: string;
  description: string;
  items: WidgetItem[];
}

export interface AvailableWidgetDescriptor {
  type: string;
  name: string;
  icon?: string;
  desc: string;
  isPlugin?: boolean;
  pluginSlug?: string;
}

export interface WidgetRenderProps {
  item: WidgetItem;
  theme?: FrontEndThemeContext;
  posts?: ContentItem[];
}

export interface WidgetAdminFormProps {
  item: WidgetItem;
  onChange: (updated: Partial<WidgetItem>) => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export interface WidgetModule {
  manifest: WidgetManifest;
  AdminForm?: ComponentType<WidgetAdminFormProps>;
  render?: ComponentType<WidgetRenderProps>;
  createDefault?: (desc: AvailableWidgetDescriptor) => WidgetItem;
}
