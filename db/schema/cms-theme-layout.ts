import { z } from "zod"

export const themeLayoutSchema = z
  .object({
    layout: z.enum([
      "full_width",
      "right_sidebar",
      "left_sidebar",
      "dual_sidebar",
    ]),
    sidebarWidth: z.number().int().min(220).max(420).nullable(),
    columnGap: z.number().int().min(0).max(80).nullable(),
    stickySidebars: z.boolean(),
  })
  .strict()

export type ThemeLayoutSettings = z.infer<typeof themeLayoutSchema>
