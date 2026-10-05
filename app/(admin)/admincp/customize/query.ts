import { initActivePlugins } from "@/lib/plugins/loader";
import { getPalettes } from "@/lib/customizer/registry";
import { getCustomizerData, getCustomizerSections } from "@/lib/themes/customizer";
import type { CustomizeData } from "./_components/types";

export async function getCustomizeQuery(targetThemeSlug?: string): Promise<CustomizeData> {
  // Plugins register `customizer_sections` filters during init.
  await initActivePlugins();

  const data = await getCustomizerData(targetThemeSlug);
  const sections = await getCustomizerSections(data.themeSlug);

  return { ...data, sections, palettes: getPalettes(data.themeSlug) };
}

export type { CustomizeData };