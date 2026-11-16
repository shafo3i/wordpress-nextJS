import { getWidgetCategoryPosts } from "@/services/widget-posts.service"
import { widgetPostQuerySchema } from "@/db/schema/cms-appearance"

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const parsed = widgetPostQuerySchema.safeParse({ categoryId: params.get("categoryId"), locale: params.get("locale") || undefined, limit: params.get("limit") || 5 })
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400, headers })
  try {
    return Response.json({ posts: await getWidgetCategoryPosts(parsed.data) }, { headers })
  } catch { return Response.json({ error: "unavailable" }, { status: 503, headers }) }
}
