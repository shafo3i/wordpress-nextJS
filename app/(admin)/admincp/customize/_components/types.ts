import type { CustomizerPayload } from "@/lib/themes/types";
import type { CustomizerSection, Palette } from "@/lib/customizer/types";

/** Everything the customizer page needs, assembled on the server. */
export type CustomizeData = CustomizerPayload & {
  sections: CustomizerSection[];
  palettes: Palette[];
};