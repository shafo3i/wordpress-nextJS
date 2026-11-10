import { ImageResponse } from "next/og"
import { getSiteSeoOptions } from "@/services/settings.service"
import { getPublicLanguageContext } from "@/lib/public-language"
import { localizedSiteOptions } from "@/lib/site-identity"
import { absoluteWebUrl, siteBaseUrl } from "@/lib/seo/urls"
import { renderSocialImage, socialImageResponse } from "@/lib/seo/social-image"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function Image() {
  const [options, language] = await Promise.all([
    getSiteSeoOptions(),
    getPublicLanguageContext(),
  ])
  const identity = localizedSiteOptions(
    options,
    language.code,
    language.defaultCode
  )
  const title = options.og_site_name || identity.blogname || ""
  const base = siteBaseUrl(options),
    customImage = absoluteWebUrl(options.og_default_image, base)
  if (customImage) {
    const card = (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#0f172a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={customImage}
          alt=""
          width={1200}
          height={630}
          style={{ objectFit: "cover" }}
        />
      </div>
    )
    try {
      const response = new ImageResponse(card, size)
      return socialImageResponse(new Uint8Array(await response.arrayBuffer()))
    } catch {
      console.warn(
        "Configured social image could not be rendered; generating the site card"
      )
    }
  }
  return socialImageResponse(
    await renderSocialImage({
      title,
      description: identity.blogdescription || "",
      heading: title,
      footer: new URL(base).hostname,
      direction: language.direction,
    })
  )
}
