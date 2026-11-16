import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"
const response = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } })
const directives = new Set([
  "default-src", "script-src", "script-src-elem", "script-src-attr",
  "style-src", "style-src-elem", "style-src-attr", "img-src", "font-src",
  "media-src", "connect-src", "frame-src", "worker-src", "object-src",
  "base-uri", "form-action", "frame-ancestors",
])

async function readReport(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new SyntaxError()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      (async () => {
        const chunks: Uint8Array[] = []
        let size = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > 16384) throw new RangeError()
          chunks.push(value)
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8"))
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new DOMException("", "TimeoutError")), 2000)
      }),
    ])
  } finally {
    clearTimeout(timer)
    void reader.cancel().catch(() => {})
  }
}

// Reports are unauthenticated, untrusted diagnostics, never proof of an attack.
// Fixed categories keep private paths, query tokens and script samples out of logs.
export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return response(403)
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/csp-report") return response(415)
  const length = request.headers.get("content-length")
  if (length && (!/^\d+$/.test(length) || Number(length) > 16384)) return response(413)
  try {
    await enforceRateLimit({ namespace: "csp-report", identifier: "site", max: 60, window: 60 })
  } catch (error) { return rateLimitResponse(error) || response(503) }
  try {
    const input = await readReport(request)
    const report = input?.["csp-report"]
    const directive = report?.["effective-directive"]
    const blocked = report?.["blocked-uri"]
    if (!directives.has(directive) || typeof blocked !== "string" || blocked.length > 4096) return response(400)
    let source = ["inline", "eval"].includes(blocked) ? blocked : "other"
    let area = "unknown"
    try {
      const document = new URL(report["document-uri"])
      if (["http:", "https:"].includes(document.protocol)) {
        area = /^\/admincp(?:\/|$)/.test(document.pathname) ? "admin"
          : /^\/studio(?:\/|$)/.test(document.pathname) ? "studio" : "public"
        const url = new URL(blocked, document)
        if (["http:", "https:"].includes(url.protocol)) source = url.origin === document.origin ? "same-origin" : "cross-origin"
        else if (["data:", "blob:"].includes(url.protocol)) source = url.protocol.slice(0, -1)
      }
    } catch { /* Invalid URLs remain fixed unknown/other categories. */ }
    // Special CSP keywords are not relative resource paths.
    if (["inline", "eval"].includes(blocked)) source = blocked
    console.warn("CSP report-only violation", { directive, source, area })
    return response(204)
  } catch (error) {
    return response(error instanceof RangeError ? 413 : error instanceof DOMException && error.name === "TimeoutError" ? 408 : 400)
  }
}
