import { cache } from "react"
import { eq, and } from "drizzle-orm"
import { db } from "@/db"
import { wpPosts, wpOptions, wpPostmeta } from "@/db/schema"
import { resolveAttachmentImage } from "@/lib/media-images"
import { setOption } from "./settings.service"
import { siteLogoIdSchema, siteLogoOptionName, type SiteLogoTarget } from "@/db/schema/cms-site-logo"

export interface SiteLogo {
  id: string
  url: string
}
export class SiteLogoError extends Error {}

async function read_getGlobalSiteLogo(target: SiteLogoTarget = "header"): Promise<SiteLogo | null> {
  const [option] = await db
    .select({ value: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, siteLogoOptionName(target)))
    .limit(1)
  // Absent global configuration preserves a legacy theme logo until Settings is used.
  if (!option) return null
  const parsed = siteLogoIdSchema.safeParse(option.value || "")
  if (!parsed.success || !parsed.data) return { id: "", url: "" }
  return { id: parsed.data, url: await getLogoAttachmentUrl(parsed.data) }
}

async function getLogoAttachmentUrl(id: string): Promise<string> {
  const [attachment] = await db
    .select({ url: wpPosts.guid, mime: wpPosts.postMimeType })
    .from(wpPosts)
    .where(and(eq(wpPosts.id, BigInt(id)), eq(wpPosts.postType, "attachment")))
    .limit(1)
  if (
    !attachment ||
    !["image/png", "image/jpeg", "image/webp"].includes(attachment.mime)
  )
    return ""
  const [file] = await db
    .select({ value: wpPostmeta.metaValue })
    .from(wpPostmeta)
    .where(
      and(
        eq(wpPostmeta.postId, BigInt(id)),
        eq(wpPostmeta.metaKey, "_wp_attached_file")
      )
    )
    .limit(1)
  return resolveAttachmentImage(attachment.url, file?.value || undefined).url
}

export async function selectSiteLogo(attachmentId: string, target: SiteLogoTarget = "header"): Promise<SiteLogo> {
  const option = siteLogoOptionName(target)
  const id = siteLogoIdSchema.parse(attachmentId)
  if (!id) throw new SiteLogoError("admin.settings.logo.invalid_selection")
  const url = await getLogoAttachmentUrl(id)
  if (!url) throw new SiteLogoError("admin.settings.logo.invalid_selection")
  await setOption(option, id)
  return { id, url }
}

export async function removeSiteLogo(target: SiteLogoTarget = "header"): Promise<void> {
  await setOption(siteLogoOptionName(target), "")
}

export const getGlobalSiteLogo = cache(read_getGlobalSiteLogo)
