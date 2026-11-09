import { sitemapResponse } from "@/lib/seo/sitemap-response"
export const dynamic = "force-dynamic"
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return sitemapResponse("news", (await params).id)
}
