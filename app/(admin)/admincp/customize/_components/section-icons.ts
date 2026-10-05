import {
  Code2,
  FileText,
  Footprints,
  Layout,
  Menu,
  Palette,
  Sliders,
  Sparkles,
  Type,
  type LucideIcon,
} from "lucide-react";

/** Sections reference icons by name so they stay serialisable (core, theme and plugin sections). */
export const SECTION_ICONS: Record<string, LucideIcon> = {
  Code2,
  FileText,
  Footprints,
  Layout,
  Menu,
  Palette,
  Sliders,
  Sparkles,
  Type,
};

export const FALLBACK_SECTION_ICON: LucideIcon = Sliders;
