import { sitemapResponse } from "@/lib/seo/sitemap-response"
export const dynamic = "force-dynamic"
export async function GET() {
  return sitemapResponse("standard")
}
