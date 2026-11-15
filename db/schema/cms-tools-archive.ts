import { z } from "zod"
import { createInsertSchema } from "drizzle-orm/zod"
import { wpPosts } from "./cms-posts"
const postColumns = createInsertSchema(wpPosts).pick({
  postTitle: true,
  postName: true,
  postContent: true,
  postExcerpt: true,
  postPassword: true,
  postMimeType: true,
})
import { categoryIdSchema } from "./cms-taxonomy"
import { languageCodeSchema } from "./cms-languages"
const id = categoryIdSchema.transform(String)
const optionalId = z.union([id, z.literal("0"), z.literal(0)]).optional()
const date = z.coerce.date().optional()
export const archivePostSchema = z.object({
  id: id.optional(),
  postTitle: postColumns.shape.postTitle.unwrap().max(10000).default(""),
  postName: postColumns.shape.postName.unwrap().max(200).default(""),
  postType: z.enum(["post", "page", "attachment"]).default("post"),
  postStatus: z
    .enum([
      "publish",
      "draft",
      "pending",
      "private",
      "trash",
      "future",
      "inherit",
    ])
    .default("draft"),
  postContent: postColumns.shape.postContent.unwrap().max(2000000).default(""),
  postExcerpt: postColumns.shape.postExcerpt.unwrap().max(100000).default(""),
  postPassword: postColumns.shape.postPassword.unwrap().max(255).default(""),
  postMimeType: postColumns.shape.postMimeType.unwrap().max(100).default(""),
  postDate: date,
  postDateGmt: date,
  guid: z.string().max(2000).default(""),
  postParent: optionalId,
  commentStatus: z.enum(["open", "closed"]).default("closed"),
  pingStatus: z.enum(["open", "closed"]).default("closed"),
})
export const toolsArchiveSchema = z.object({
  data: z.object({
    posts: z.array(archivePostSchema).max(10000),
    terms: z
      .array(
        z.object({
          termId: id,
          name: z.string().min(1).max(200),
          slug: z.string().min(1).max(200),
        })
      )
      .max(10000)
      .default([]),
    taxonomies: z
      .array(
        z.object({
          termTaxonomyId: id,
          termId: id,
          taxonomy: z.enum(["category", "post_tag"]),
          description: z.string().max(10000).default(""),
          parent: optionalId,
        })
      )
      .max(10000)
      .default([]),
    relationships: z
      .array(z.object({ objectId: id, termTaxonomyId: id }))
      .max(100000)
      .default([]),
    metadata: z
      .array(
        z.object({
          postId: id,
          metaKey: z.string().max(255),
          metaValue: z.string().max(2000000).default(""),
        })
      )
      .max(100000)
      .default([]),
    comments: z
      .array(
        z.object({
          commentId: id,
          commentPostId: id,
          commentAuthor: z.string().max(245).default(""),
          commentAuthorEmail: z.string().max(100).default(""),
          commentAuthorUrl: z.string().max(2000).default(""),
          commentContent: z.string().max(20000),
          commentApproved: z
            .enum(["0", "1", "spam", "trash", "pending"])
            .default("0"),
          commentParent: optionalId,
          commentDate: date,
          commentDateGmt: date,
        })
      )
      .max(100000)
      .default([]),
    postTranslations: z
      .array(
        z.object({
          postId: id,
          languageCode: languageCodeSchema,
          translationGroupId: z.string().min(1).max(64),
        })
      )
      .max(10000)
      .default([]),
    termTranslations: z
      .array(
        z.object({
          termTaxonomyId: id,
          languageCode: languageCodeSchema,
          translationGroupId: z.string().min(1).max(64),
        })
      )
      .max(10000)
      .default([]),
  }),
})
export type ToolsArchive = z.output<typeof toolsArchiveSchema>
export const PORTABLE_META_KEYS = [
  "_thumbnail_id",
  "_featured_video_url",
  "_is_featured",
  "_wp_attached_file",
  "_wp_attachment_metadata",
  "_wp_attachment_image_alt",
  "_seo_title",
  "_seo_description",
  "_seo_og_image",
  "_seo_canonical",
  "_seo_noindex",
] as const
