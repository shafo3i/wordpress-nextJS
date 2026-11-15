import { ZodError } from "zod"
import { checkCmsRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import { studioContentRequestSchema } from "@/db/schema/cms-studio-content"
import {
  getStudioWidgetContent,
  StudioContentError,
} from "@/services/studio-content.service"

export const dynamic = "force-dynamic"
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" }
export async function GET(request: Request) {
  let session
  try {
    session = await verifyAdminOrEditor()
  } catch {
    return Response.json({ error: "unauthorized" }, { status: 401, headers })
  }
  try {
    await checkCmsRateLimit(session.user.id, "studio-content")
    const input = studioContentRequestSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    )
    return Response.json(await getStudioWidgetContent(input), { headers })
  } catch (error) {
    const limited = rateLimitResponse(error)
    if (limited) return limited
    return Response.json(
      {
        error:
          error instanceof ZodError || error instanceof StudioContentError
            ? "invalid_query"
            : "studio_content_failed",
      },
      {
        status:
          error instanceof ZodError || error instanceof StudioContentError
            ? 400
            : 500,
        headers,
      }
    )
  }
}
