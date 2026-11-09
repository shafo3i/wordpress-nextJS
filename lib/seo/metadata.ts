import type { Metadata } from "next"
import { absoluteWebUrl, siteBaseUrl } from "./urls"

export function indexingAllowed(
  options: Record<string, string>,
  noindex = false
) {
  return (
    options.blog_public !== "0" &&
    !noindex &&
    !(options.seo_robots_extra || "")
      .toLowerCase()
      .split(/[,\s]+/)
      .includes("noindex")
  )
}

export function seoRobots(
  options: Record<string, string>,
  noindex = false
): Metadata["robots"] {
  const extra = (options.seo_robots_extra || "").toLowerCase().split(/[,\s]+/)
  const index = indexingAllowed(options, noindex)
  const imagePreview = extra
    .find((value) => value.startsWith("max-image-preview:"))
    ?.split(":")[1]
  const numberDirective = (key: string) => {
    const value = extra
      .find((value) => value.startsWith(`${key}:`))
      ?.split(":")[1]
    const number = Number(value)
    return value &&
      /^(?:-1|0|[1-9]\d*)$/.test(value) &&
      Number.isSafeInteger(number)
      ? number
      : undefined
  }
  return {
    index,
    follow: !extra.includes("nofollow"),
    googleBot: {
      index,
      follow: !extra.includes("nofollow"),
      "max-snippet": numberDirective("max-snippet"),
      "max-video-preview": numberDirective("max-video-preview"),
      ...(imagePreview && ["none", "standard", "large"].includes(imagePreview)
        ? { "max-image-preview": imagePreview as "none" | "standard" | "large" }
        : {}),
    },
  }
}

export function buildSiteMetadata(options: Record<string, string>): Metadata {
  const base = siteBaseUrl(options)
  const image =
    absoluteWebUrl(options.og_default_image, base) || `${base}/opengraph-image`
  return {
    metadataBase: new URL(base),
    verification: {
      google: options.google_site_verification || undefined,
      other: options.bing_site_verification
        ? { "msvalidate.01": options.bing_site_verification }
        : {},
    },
    title: {
      default: options.blogname,
      template: (options.seo_meta_title_template || "%title%")
        .replaceAll("%title%", "%s")
        .replaceAll("%sitename%", options.blogname),
    },
    description:
      options.seo_default_meta_description || options.blogdescription,
    robots: seoRobots(options),
    openGraph: {
      type: "website",
      siteName: options.og_site_name || options.blogname,
      title: options.blogname,
      description: options.blogdescription,
      images: [{ url: image, width: 1200, height: 630, alt: options.blogname }],
    },
    twitter: {
      card:
        options.twitter_card_type === "summary"
          ? "summary"
          : "summary_large_image",
      site: options.twitter_site_handle || undefined,
      images: [image],
    },
    other: options.facebook_app_id
      ? { "fb:app_id": options.facebook_app_id }
      : {},
  }
}
