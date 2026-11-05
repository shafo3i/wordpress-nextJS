import {
  getStudioWidgetDefinition,
  isStudioElementCompatible,
  STUDIO_EDITORIAL_TYPES,
} from "@/lib/studio/widget-registry"
import { z } from "zod"
import type {
  StudioDocumentData,
  StudioElement,
  StudioElementSettings,
} from "@/lib/studio/types"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import { getSafeStudioUrl } from "@/lib/studio/urls"
import {
  studioContentLocaleSchema,
  studioCategoryIdSchema,
} from "./cms-studio-content"

const linkSchema = z
  .string()
  .max(2000)
  .refine(
    (value) => value === "" || Boolean(getSafeStudioUrl(value)),
    "Unsafe widget URL."
  )
const mediaSchema = z
  .string()
  .max(2000)
  .refine(
    (value) => value === "" || Boolean(getSafeStudioUrl(value, true)),
    "Unsafe media URL."
  )

export const studioPageTemplateSchema = z.enum([
  "studio_full_width",
  "studio_canvas",
  "default",
  "with-sidebar",
])
const studioTabSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().max(100_000),
  content: z.string().max(100_000),
})
const studioBlockSchema: z.ZodType<HomepageBlock> = z.object({
  id: z.string().min(1).max(200),
  type: z.enum(STUDIO_EDITORIAL_TYPES),
  title: z.string().max(100_000),
  titles: z.record(z.string(), z.string().max(100_000)).optional(),
  enabled: z.boolean(),
  order: z.number().finite(),
  categorySlug: z.string().max(200).optional(),
  categoryId: studioCategoryIdSchema.optional(),
  contentLocale: studioContentLocaleSchema.optional(),
  sortOrder: z.enum(["newest", "oldest"]).optional(),
  autoplay: z.boolean().optional(),
  rotationInterval: z.number().int().min(2000).max(30000).optional(),
  featuredOnly: z.boolean().optional(),
  postCount: z.number().int().min(1).max(100).optional(),
  displayStyle: z
    .enum([
      "headline_cover",
      "bento",
      "lead_side_list",
      "lead_right_side_list",
      "grid_3",
      "grid_4",
      "list_thumb_left",
      "list_thumb_right",
      "hero_slider",
      "featured_slider",
      "broadsheet_wire",
      "overlay_cards",
      "minimal_text",
      "breaking_bar",
      "dual_columns",
      "numbered_strip",
      "split_cover",
      "cards_carousel",
    ])
    .optional(),
  imageRatio: z.enum(["landscape", "square", "portrait", "none"]).optional(),
  showTitle: z.boolean().optional(),
  showExcerpt: z.boolean().optional(),
  showAuthor: z.boolean().optional(),
  showDate: z.boolean().optional(),
  showCategory: z.boolean().optional(),
  subtitle: z.string().max(100_000).optional(),
  subtitles: z.record(z.string(), z.string().max(100_000)).optional(),
  linkText: z.string().max(100_000).optional(),
  linkHref: linkSchema.optional(),
  showColumnHeaders: z.boolean().optional(),
  col1Title: z.string().max(100_000).optional(),
  col2Title: z.string().max(100_000).optional(),
  col3Title: z.string().max(100_000).optional(),
})

export const studioSettingsSchema: z.ZodType<StudioElementSettings> = z.object({
  containerType: z.enum(["flexbox", "grid", "div", "container"]).optional(),
  contentWidth: z.union([z.literal("boxed"), z.literal("full")]).optional(),
  maxWidth: z.number().finite().optional(),
  minHeight: z.number().finite().optional(),
  widthPercent: z.number().finite().optional(),
  flexDirection: z
    .union([
      z.literal("row"),
      z.literal("column"),
      z.literal("row-reverse"),
      z.literal("column-reverse"),
    ])
    .optional(),
  justifyContent: z
    .union([
      z.literal("flex-start"),
      z.literal("center"),
      z.literal("flex-end"),
      z.literal("space-between"),
      z.literal("space-around"),
      z.literal("space-evenly"),
    ])
    .optional(),
  alignItems: z
    .union([
      z.literal("stretch"),
      z.literal("flex-start"),
      z.literal("center"),
      z.literal("flex-end"),
    ])
    .optional(),
  flexWrap: z.union([z.literal("nowrap"), z.literal("wrap")]).optional(),
  gridColumns: z.number().int().min(1).max(24).optional(),
  gap: z.number().finite().optional(),
  text: z.string().max(100_000).optional(),
  subText: z.string().max(100_000).optional(),
  htmlTag: z
    .union([
      z.literal("h1"),
      z.literal("h2"),
      z.literal("h3"),
      z.literal("h4"),
      z.literal("h5"),
      z.literal("h6"),
      z.literal("p"),
      z.literal("div"),
      z.literal("span"),
    ])
    .optional(),
  align: z
    .union([
      z.literal("start"),
      z.literal("center"),
      z.literal("end"),
      z.literal("justify"),
    ])
    .optional(),
  linkUrl: linkSchema.optional(),
  linkTarget: z.union([z.literal("_self"), z.literal("_blank")]).optional(),
  imageUrl: mediaSchema.optional(),
  imageAlt: z.string().max(100_000).optional(),
  imageHeight: z.number().finite().optional(),
  objectFit: z
    .union([z.literal("cover"), z.literal("contain"), z.literal("fill")])
    .optional(),
  buttonText: z.string().max(100_000).optional(),
  buttonUrl: linkSchema.optional(),
  buttonVariant: z
    .union([
      z.literal("primary"),
      z.literal("secondary"),
      z.literal("outline"),
      z.literal("dark"),
    ])
    .optional(),
  buttonSize: z
    .union([z.literal("sm"), z.literal("md"), z.literal("lg")])
    .optional(),
  videoUrl: mediaSchema.optional(),
  aspectRatio: z
    .union([z.literal("16/9"), z.literal("4/3"), z.literal("1/1")])
    .optional(),
  dividerStyle: z
    .union([
      z.literal("solid"),
      z.literal("dashed"),
      z.literal("dotted"),
      z.literal("double"),
    ])
    .optional(),
  dividerWeight: z.number().finite().optional(),
  dividerColor: z.string().max(100_000).optional(),
  spacerHeight: z.number().finite().optional(),
  tabsItems: z.array(studioTabSchema).max(1000).optional(),
  accordionItems: z.array(studioTabSchema).max(1000).optional(),
  svgCode: z.string().max(100_000).optional(),
  htmlCode: z.string().max(100_000).optional(),
  mapAddress: z.string().max(100_000).optional(),
  mapZoom: z.number().finite().optional(),
  iconName: z.string().max(100_000).optional(),
  iconSize: z.number().finite().optional(),
  galleryImages: z.array(mediaSchema).max(1000).optional(),
  counterValue: z.number().finite().optional(),
  counterSuffix: z.string().max(100_000).optional(),
  progressPercent: z.number().finite().optional(),
  testimonialName: z.string().max(100_000).optional(),
  testimonialRole: z.string().max(100_000).optional(),
  testimonialAvatar: mediaSchema.optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().max(100_000),
        url: linkSchema,
      })
    )
    .max(1000)
    .optional(),
  alertType: z
    .union([
      z.literal("info"),
      z.literal("success"),
      z.literal("warning"),
      z.literal("danger"),
    ])
    .optional(),
  soundcloudUrl: mediaSchema.optional(),
  shortcodeText: z.string().max(100_000).optional(),
  anchorId: z.string().max(100_000).optional(),
  ratingValue: z.number().finite().optional(),
  ratingMax: z.number().int().min(1).max(20).optional(),
  blockConfig: studioBlockSchema.optional(),
  widgetId: z.string().max(100_000).optional(),
  widgetTitle: z.string().max(100_000).optional(),
  widgetConfig: z.record(z.string(), z.unknown()).optional(),
  widgetLocale: z.string().max(100_000).optional(),
  textColor: z.string().max(100_000).optional(),
  tickerLabelColor: z.string().max(200).optional(),
  tickerLabelBackground: z.string().max(200).optional(),
  tickerMetaColor: z.string().max(200).optional(),
  tickerControlsColor: z.string().max(200).optional(),
  backgroundColor: z.string().max(100_000).optional(),
  fontSize: z.number().finite().optional(),
  fontWeight: z
    .union([
      z.literal("400"),
      z.literal("500"),
      z.literal("600"),
      z.literal("700"),
      z.literal("800"),
      z.literal("900"),
    ])
    .optional(),
  lineHeight: z.number().finite().optional(),
  letterSpacing: z.number().finite().optional(),
  borderStyle: z
    .union([
      z.literal("none"),
      z.literal("solid"),
      z.literal("dashed"),
      z.literal("dotted"),
    ])
    .optional(),
  borderWidth: z.number().finite().optional(),
  borderColor: z.string().max(100_000).optional(),
  borderRadius: z.number().finite().optional(),
  boxShadow: z
    .union([
      z.literal("none"),
      z.literal("sm"),
      z.literal("md"),
      z.literal("lg"),
      z.literal("xl"),
    ])
    .optional(),
  paddingTop: z.number().finite().optional(),
  paddingRight: z.number().finite().optional(),
  paddingBottom: z.number().finite().optional(),
  paddingLeft: z.number().finite().optional(),
  marginTop: z.number().finite().optional(),
  marginRight: z.number().finite().optional(),
  marginBottom: z.number().finite().optional(),
  marginLeft: z.number().finite().optional(),
  customClass: z.string().max(100_000).optional(),
  customId: z.string().max(100_000).optional(),
  hideOnDesktop: z.boolean().optional(),
  hideOnTablet: z.boolean().optional(),
  hideOnMobile: z.boolean().optional(),
})

const studioElementSchema: z.ZodType<StudioElement> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1).max(200),
      elType: z.enum(["container", "widget"]),
      widgetType: z.custom<StudioElement["widgetType"]>(
        (value) =>
          typeof value === "string" && Boolean(getStudioWidgetDefinition(value))
      ),
      title: z.string().max(100_000).optional(),
      hidden: z.boolean().optional(),
      settings: studioSettingsSchema,
      elements: z.array(studioElementSchema).max(1000),
    })
    .refine(
      isStudioElementCompatible,
      "Widget type, children, and payload must match its registered definition."
    )
)

// Bound work before running the recursive schema, including malformed/cyclic trees.
const boundedDocumentSchema = z.unknown().superRefine((value, ctx) => {
  try {
    if (JSON.stringify(value)?.length > 500_000)
      throw new Error("Studio document is too large.")
    const queue = [{ node: value, depth: 0 }]
    const ids = new Set<string>()
    let count = 0
    while (queue.length) {
      const { node, depth } = queue.pop()!
      if (!node || typeof node !== "object") continue
      if (depth > 30 || ++count > 1001)
        throw new Error("Studio document exceeds layout limits.")
      const record = node as { id?: unknown; elements?: unknown }
      if (typeof record.id === "string") {
        if (ids.has(record.id))
          throw new Error("Studio element IDs must be unique.")
        ids.add(record.id)
      }
      if (Array.isArray(record.elements)) {
        for (const child of record.elements)
          queue.push({ node: child, depth: depth + 1 })
      }
    }
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Invalid Studio document size, depth, or element IDs.",
    })
  }
})

export const studioDocumentSchema: z.ZodType<StudioDocumentData> =
  boundedDocumentSchema.pipe(
    z.object({
      version: z.literal("1.0"),
      pageTemplate: studioPageTemplateSchema,
      elements: z.array(studioElementSchema).max(1000),
      settings: z
        .object({
          pageTemplate: studioPageTemplateSchema.optional(),
          hideTitle: z.boolean().optional(),
          backgroundColor: z.string().max(200).optional(),
        })
        .optional(),
    })
  )

export const studioPageIdSchema = z
  .string()
  .max(19)
  .regex(/^[1-9][0-9]*$/)
  .refine(
    (value) =>
      /^[1-9][0-9]*$/.test(value) &&
      value.length <= 19 &&
      BigInt(value) <= BigInt("9223372036854775807")
  )

export const saveStudioPageSchema = z.object({
  pageId: studioPageIdSchema,
  title: z.string().trim().max(1000).optional(),
  status: z.enum(["draft", "pending", "publish", "private"]).optional(),
  template: studioPageTemplateSchema.optional(),
  document: studioDocumentSchema,
  setAsFrontPage: z.boolean().optional(),
})
export type SaveStudioPageInput = z.input<typeof saveStudioPageSchema>
