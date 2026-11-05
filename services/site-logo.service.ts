import sharp from "sharp"
import { randomUUID } from "node:crypto"
import { eq, and } from "drizzle-orm"
import { db } from "@/db"
import { wpPosts, wpOptions } from "@/db/schema"
import { uploadMediaFile } from "./media.service"
import { setOption } from "./settings.service"
import {
  SITE_LOGO_MAX_BYTES,
  siteLogoIdSchema,
} from "@/db/schema/cms-site-logo"

export interface SiteLogo {
  id: string
  url: string
}
export class SiteLogoError extends Error {}

export async function normalizeSiteLogo(file: File): Promise<Buffer> {
  if (!file.size || file.size > SITE_LOGO_MAX_BYTES)
    throw new SiteLogoError("admin.settings.logo.invalid_file")
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 16_000_000,
      failOn: "warning",
      animated: false,
    })
    const metadata = await image.metadata()
    if (
      !["png", "jpeg", "webp"].includes(metadata.format || "") ||
      (metadata.pages || 1) > 1 ||
      !metadata.width ||
      !metadata.height
    )
      throw new Error()
    return await image
      .rotate()
      .resize({
        width: 1600,
        height: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 95 })
      .toBuffer()
  } catch {
    throw new SiteLogoError("admin.settings.logo.invalid_file")
  }
}

export async function getGlobalSiteLogo(): Promise<SiteLogo | null> {
  const [option] = await db
    .select({ value: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, "site_logo_id"))
    .limit(1)
  // Absent global configuration preserves a legacy theme logo until Settings is used.
  if (!option) return null
  const parsed = siteLogoIdSchema.safeParse(option.value || "")
  if (!parsed.success || !parsed.data) return { id: "", url: "" }
  const [attachment] = await db
    .select({ url: wpPosts.guid, mime: wpPosts.postMimeType })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.id, BigInt(parsed.data)),
        eq(wpPosts.postType, "attachment")
      )
    )
    .limit(1)
  const url = attachment?.url || ""
  const safeUrl =
    /^(?:\/(?!\/)|https?:\/\/)/.test(url) && !/[\u0000-\u0020\\]/.test(url)
  return {
    id: parsed.data,
    url:
      safeUrl &&
      ["image/png", "image/jpeg", "image/webp"].includes(attachment?.mime || "")
        ? url
        : "",
  }
}

export async function uploadSiteLogo(
  file: File,
  authorId: string
): Promise<SiteLogo> {
  const buffer = await normalizeSiteLogo(file)
  const item = await uploadMediaFile(
    buffer,
    `site-logo-${randomUUID()}.webp`,
    "image/webp",
    authorId
  )
  const id = siteLogoIdSchema.parse(String(item.id))
  await setOption("site_logo_id", id)
  return { id, url: item.url }
}

export async function removeSiteLogo(): Promise<void> {
  await setOption("site_logo_id", "")
}
