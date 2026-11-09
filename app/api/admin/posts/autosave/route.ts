import { headers } from "next/headers"
import { auth } from "@/auth"
import {
  autosaveDocumentKey,
  postAutosaveRequestSchema,
  AUTOSAVE_MAX_BYTES,
} from "@/db/schema/cms-post-autosave"
import {
  getPostAutosave,
  savePostAutosave,
  PostAutosaveError,
} from "@/services/post-autosave.service"

export const dynamic = "force-dynamic"
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
async function editor() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session && ["admin", "editor"].includes(session.user.role || "")
    ? session
    : null
}
export async function GET(request: Request) {
  try {
    const session = await editor()
    if (!session) return json({ error: "expired" }, 401)
    const url = new URL(request.url),
      key = autosaveDocumentKey.safeParse(url.searchParams.get("documentKey"))
    if (!key.success) return json({ error: "invalid" }, 400)
    if (url.searchParams.get("ownerId") !== session.user.id)
      return json({ error: "account_changed" }, 403)
    return json({
      ownerId: session.user.id,
      record: await getPostAutosave(session.user.id, key.data),
    })
  } catch {
    return json({ error: "unavailable" }, 503)
  }
}
export async function POST(request: Request) {
  try {
    const session = await editor()
    if (!session) return json({ error: "expired" }, 401)
    const origins = [
      new URL(request.url).origin,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
    ]
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value!).origin
        } catch {
          return ""
        }
      })
      .filter(Boolean)
    if (!origins.includes(request.headers.get("origin") || ""))
      return json({ error: "origin" }, 403)
    const reader = request.body?.getReader()
    if (!reader) return json({ error: "invalid" }, 400)
    let size = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.byteLength
      if (size > AUTOSAVE_MAX_BYTES) {
        await reader.cancel()
        return json({ error: "too_large" }, 413)
      }
      chunks.push(next.value)
    }
    const parsed = postAutosaveRequestSchema.safeParse(
      JSON.parse(Buffer.concat(chunks).toString("utf8"))
    )
    if (!parsed.success) return json({ error: "invalid" }, 400)
    if (parsed.data.ownerId !== session.user.id)
      return json({ error: "account_changed" }, 403)
    return json({
      ownerId: session.user.id,
      record: await savePostAutosave(session.user.id, parsed.data),
    })
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: "invalid" }, 400)
    if (error instanceof PostAutosaveError)
      return json({ error: error.code }, error.status)
    return json({ error: "unavailable" }, 503)
  }
}
