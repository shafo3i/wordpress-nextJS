import type { CustomizerSection } from "@/lib/customizer/types";
import { breakingNewsSections } from "./breaking-news/customizer";

/**
 * Customizer sections owned by plugins, keyed by plugin slug. Settings are always part of
 * the schema (defaults and CSS variables), the sections are only shown while the plugin is active.
 */
export const PLUGIN_CUSTOMIZER_SECTIONS: Record<string, CustomizerSection[]> = {
  "breaking-news": breakingNewsSections,
};