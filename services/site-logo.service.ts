import { eq, and } from "drizzle-orm"
import { db } from "@/db"
import { wpPosts, wpOptions } from "@/db/schema"
import { setOption } from "./settings.service"
import { siteLogoIdSchema } from "@/db/schema/cms-site-logo"

export interface SiteLogo {
  id: string
  url: string
}
export class SiteLogoError extends Error {}

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

export async function removeSiteLogo(): Promise<void> {
  await setOption("site_logo_id", "")
}
