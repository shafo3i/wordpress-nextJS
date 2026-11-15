import { rateLimitResponse } from "@/lib/rate-limit"
import {
  videoThumbnail,
  VideoThumbnailError,
} from "@/services/video-thumbnail.service"

export const runtime = "nodejs"
export async function GET(request: Request) {
  try {
    const image = await videoThumbnail(
      new URL(request.url).searchParams.get("src") || ""
    )
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    })
  } catch (error) {
    const limited = rateLimitResponse(error)
    if (limited) return limited
    return new Response(null, {
      status: error instanceof VideoThumbnailError ? error.status : 404,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
