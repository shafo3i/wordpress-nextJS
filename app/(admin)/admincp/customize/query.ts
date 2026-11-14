import { verifyAdmin } from "@/lib/authMIddleware";
import "server-only";
import { initActivePlugins } from "@/lib/plugins/loader"
import { getPalettes } from "@/lib/customizer/registry"
import {
  getCustomizerData,
  getCustomizerSections,
} from "@/lib/themes/customizer"
import type { CustomizeData } from "./_components/types"

export async function getCustomizeQuery(
  targetThemeSlug?: string
): Promise<CustomizeData> {
  await verifyAdmin();
  // Plugins register `customizer_sections` filters during init.
  const plugins = await initActivePlugins()

  const data = await getCustomizerData(targetThemeSlug)
  const sections = await plugins.applyFilters(
    "customizer_sections",
    await getCustomizerSections(data.themeSlug),
    { themeSlug: data.themeSlug }
  )

  return { ...data, sections, palettes: getPalettes(data.themeSlug) }
}

export type { CustomizeData }
