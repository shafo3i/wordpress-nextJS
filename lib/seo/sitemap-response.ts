import {
  generateNewsSitemapXml,
  generateStandardSitemapXml,
} from "@/services/sitemap.service"

export async function sitemapResponse(kind: "news" | "standard", id?: string) {
  if (id !== undefined && !/^(?:0|[1-9]\d{0,5})\.xml$/.test(id))
    return new Response(null, { status: 404 })
  try {
    const part = id === undefined ? undefined : Number(id.slice(0, -4))
    const xml = await (kind === "news"
      ? generateNewsSitemapXml(part)
      : generateStandardSitemapXml(part))
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control":
          "public, max-age=0, s-maxage=60, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    if (error instanceof RangeError) return new Response(null, { status: 404 })
    console.error("Sitemap generation failed", error)
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
