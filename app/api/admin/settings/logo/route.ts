import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { SITE_LOGO_MAX_BYTES } from "@/db/schema/cms-site-logo"
import { SiteLogoError } from "@/services/site-logo.service"
import { uploadSiteLogo } from "@/services/site-logo-upload.service"

export const runtime = "nodejs"
const response = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  })

export async function POST(request: Request) {
  let session
  try {
    session = await auth.api.getSession({ headers: request.headers })
  } catch {
    return response({ error: "admin.settings.logo.session_unavailable" }, 503)
  }
  if (!session)
    return response({ error: "admin.settings.logo.unauthorized" }, 401)
  if (!["admin", "editor"].includes(session.user.role || ""))
    return response({ error: "admin.settings.logo.forbidden" }, 403)
  const userId = session.user.id
  const origin = request.headers.get("origin")
  const allowedOrigins = [
    request.url,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ].flatMap((value) => {
    try {
      const url = new URL(value || "")
      return ["http:", "https:"].includes(url.protocol) ? [url.origin] : []
    } catch {
      return []
    }
  })
  if (
    (origin && !allowedOrigins.includes(origin)) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return response({ error: "admin.settings.logo.origin_rejected" }, 403)
  try {
    // Bound the actual request stream, including requests without Content-Length.
    const maxBody = SITE_LOGO_MAX_BYTES + 64 * 1024
    const reader = request.body?.getReader()
    if (!reader) throw new SiteLogoError("admin.settings.logo.invalid_file")
    const chunks: Uint8Array[] = []
    let length = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBody) {
        await reader.cancel()
        throw new SiteLogoError("admin.settings.logo.invalid_file")
      }
      chunks.push(value)
    }
    const form = await new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") || "" },
      body: Buffer.concat(chunks),
    })
      .formData()
      .catch(() => {
        throw new SiteLogoError("admin.settings.logo.invalid_file")
      })
    const files = form.getAll("file")
    if (files.length !== 1 || !(files[0] instanceof File))
      throw new SiteLogoError("admin.settings.logo.invalid_file")
    const logo = await uploadSiteLogo(files[0], userId)
    revalidatePath("/", "layout")
    return response({ logo })
  } catch (error) {
    return response(
      {
        error:
          error instanceof SiteLogoError
            ? error.message
            : "admin.settings.logo.upload_error",
      },
      error instanceof SiteLogoError ? 400 : 500
    )
  }
}
