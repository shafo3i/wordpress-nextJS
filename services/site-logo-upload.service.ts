import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import sharp from "sharp"
import { randomUUID } from "node:crypto"
import { uploadMediaFile } from "./media.service"
import { setOption } from "./settings.service"
import { SiteLogoError, type SiteLogo } from "./site-logo.service"
import {
  SITE_LOGO_MAX_BYTES,
  siteLogoIdSchema,
} from "@/db/schema/cms-site-logo"

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

export async function uploadSiteLogo(
  file: File,
  authorId: string
): Promise<SiteLogo> {
  await verifyAdmin();
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
