import { NextRequest, NextResponse, after } from "next/server"
import {
  findMatchingRedirect,
  recordRedirectHit,
} from "@/services/redirect.service"
export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" }
  try {
    const path = request.nextUrl.searchParams.get("path")
    const matched = path ? await findMatchingRedirect(path) : null
    if (!matched) return NextResponse.json({ matched: false }, { headers })
    after(async () => {
      try {
        await recordRedirectHit(matched.id)
      } catch {
        /* Analytics cannot break navigation. */
      }
    })
    return NextResponse.json(
      {
        matched: true,
        targetUrl: matched.targetUrl,
        statusCode: matched.statusCode,
      },
      { headers }
    )
  } catch {
    return NextResponse.json({ matched: false }, { headers })
  }
}
