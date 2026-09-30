import { getCustomizerData, CustomizerPayload } from "@/lib/themes/customizer";

export async function getCustomizeQuery(targetThemeSlug?: string): Promise<CustomizerPayload> {
  return await getCustomizerData(targetThemeSlug);
}

export type { CustomizerPayload };
