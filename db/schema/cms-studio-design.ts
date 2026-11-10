import { z } from "zod"
import { FONTS } from "@/lib/customizer/fonts"

export const studioColorSchema = z
  .string()
  .max(120)
  .regex(
    /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%/-]+\)|var\(--theme-[a-z-]+\)|[a-zA-Z]+)$/i
  )
const typography = z.object({
  size: z.number().finite().min(0).max(200).optional(),
  unit: z.enum(["px", "rem", "em"]).optional(),
  family: z
    .string()
    .max(80)
    .refine(
      (value) =>
        ["inherit", "serif", "sans-serif", "monospace"].includes(value) ||
        FONTS.some((font) => font.id === value)
    )
    .optional(),
  weight: z.enum(["300", "400", "500", "600", "700", "800", "900"]).optional(),
  fontStyle: z.enum(["normal", "italic"]).optional(),
  lineHeight: z.number().finite().min(0.5).max(4).optional(),
  spacing: z.number().finite().min(-10).max(30).optional(),
  color: studioColorSchema.optional(),
  hoverColor: studioColorSchema.optional(),
  align: z.enum(["start", "center", "end", "justify"]).optional(),
  transform: z
    .enum(["none", "uppercase", "lowercase", "capitalize"])
    .optional(),
  decoration: z.enum(["none", "underline", "line-through"]).optional(),
})
const responsiveTypography = z.object({
  desktop: typography.optional(),
  tablet: typography.optional(),
  mobile: typography.optional(),
})
const corners = z.object({
  topLeft: z.number().min(0).max(200),
  topRight: z.number().min(0).max(200),
  bottomRight: z.number().min(0).max(200),
  bottomLeft: z.number().min(0).max(200),
})
export const studioDesignSchema = z.object({
  typography: z
    .object({
      heading: responsiveTypography.optional(),
      title: responsiveTypography.optional(),
      text: responsiveTypography.optional(),
      excerpt: responsiveTypography.optional(),
      meta: responsiveTypography.optional(),
      category: responsiveTypography.optional(),
    })
    .optional(),
  cardRadius: corners.optional(),
  imageRadius: corners.optional(),
  cardBackground: studioColorSchema.optional(),
  cardBorders: z.boolean().optional(),
  postDividers: z.boolean().optional(),
  sectionTitleBorder: z.boolean().optional(),
  cardBorderStyle: z.enum(["none", "solid", "dashed", "dotted"]).optional(),
  cardBorderWidth: z.number().min(0).max(20).optional(),
  cardBorderColor: studioColorSchema.optional(),
  gap: z.number().min(0).max(120).optional(),
  cardPadding: z.number().min(0).max(120).optional(),
  thumbnailWidth: z.number().min(40).max(320).optional(),
  thumbnailPosition: z.enum(["start", "end"]).optional(),
  titleLines: z.number().int().min(1).max(8).optional(),
  excerptLength: z.number().int().min(0).max(600).optional(),
  shadow: z
    .object({
      x: z.number().min(-100).max(100),
      y: z.number().min(-100).max(100),
      blur: z.number().min(0).max(100),
      spread: z.number().min(-50).max(100),
      color: studioColorSchema,
    })
    .optional(),
})
export type StudioDesign = z.infer<typeof studioDesignSchema>
export type StudioTypography = z.infer<typeof typography>
