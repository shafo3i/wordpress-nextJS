import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { env } from "@/lib/env"
import { db } from "@/db"
import { postViewIdSchema } from "@/db/schema/cms-post-filters"
import {
  getPostViewCounts,
  recordPostView,
} from "@/services/post-views.service"
import {
  isAutomatedVisitor,
  visitorToken,
  viewHash,
  VIEW_COOKIE,
} from "@/lib/post-view-token"

export const runtime = "nodejs"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = postViewIdSchema.safeParse((await params).id)
  if (!id.success) return new NextResponse(null, { status: 400 })
  if (
    request.headers.get("origin") !== new URL(env.NEXT_PUBLIC_APP_URL).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new NextResponse(null, { status: 403 })
  const session = await auth.api.getSession({ headers: request.headers })
  if (
    ["admin", "editor"].includes(session?.user.role || "") ||
    isAutomatedVisitor(request.headers.get("user-agent") || "")
  ) {
    const views = (await getPostViewCounts([id.data], db, true)).get(id.data)
    if (views === undefined) return new NextResponse(null, { status: 404 })
    return NextResponse.json(
      { views, counted: false },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
  const visitor = visitorToken(
    env.BETTER_AUTH_SECRET,
    request.cookies.get(VIEW_COOKIE)?.value
  )
  // Only use proxy-provided identity for a coarse request budget, never for unique-reader claims.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  const result = await recordPostView(
    BigInt(id.data),
    viewHash(`visit:${visitor.id}`, env.BETTER_AUTH_SECRET),
    viewHash(
      `request:${ip}:${request.headers.get("user-agent") || ""}`,
      env.BETTER_AUTH_SECRET
    )
  )
  if (!result) return new NextResponse(null, { status: 404 })
  const response = NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  })
  if (visitor.fresh)
    response.cookies.set(VIEW_COOKIE, visitor.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(env.NEXT_PUBLIC_APP_URL).protocol === "https:",
      maxAge: 86400,
      path: "/",
    })
  return response
}
