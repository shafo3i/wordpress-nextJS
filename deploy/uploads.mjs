import { createReadStream } from "node:fs"
import { Readable } from "node:stream"
import { realpath, stat } from "node:fs/promises"
import { extname, resolve, sep, relative as relativePath } from "node:path"

const types = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

export async function resolveUpload(req, directory) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox",
    "Referrer-Policy": "no-referrer",
  }
  const setHeader = (name, value) => { headers[name] = String(value) }
  let pathname = (req.url || "").split("?", 1)[0]
  try {
    pathname = decodeURIComponent(pathname)
  } catch {
    if (!pathname.startsWith("/uploads")) return false
    return { status: 400, headers }
  }
  if (!pathname.startsWith("/uploads/") && !pathname.startsWith("/uploads\\"))
    return false
  const end = (status) => {
    return { status, headers }
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    setHeader("Allow", "GET, HEAD")
    return end(405)
  }
  const relative = pathname.slice("/uploads/".length)
  const parts = relative.split("/")
  if (
    !relative ||
    /[\\:\u0000-\u001f]/.test(relative) ||
    parts.some((p) => !p || p.startsWith("."))
  )
    return end(404)
  const contentType = types[extname(relative).toLowerCase()]
  if (!contentType) return end(404)
  let filename, info
  try {
    const root = await realpath(directory)
    filename = await realpath(resolve(root, ...parts))
    if (!filename.startsWith(root + sep)) return end(404)
    if (
      relativePath(root, filename)
        .split(sep)
        .some((part) => part.startsWith("."))
    )
      return end(404)
    info = await stat(filename)
    if (!info.isFile()) return end(404)
  } catch {
    return end(404)
  }
  let start = 0,
    finish = info.size - 1,
    status = 200
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
    if (!match || (!match[1] && !match[2])) {
      setHeader("Content-Range", `bytes */${info.size}`)
      return end(416)
    }
    if (match[1]) {
      start = Number(match[1])
      finish = match[2] ? Math.min(Number(match[2]), finish) : finish
    } else start = Math.max(0, info.size - Number(match[2]))
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(finish) ||
      start < 0 ||
      start > finish ||
      start >= info.size
    ) {
      setHeader("Content-Range", `bytes */${info.size}`)
      return end(416)
    }
    status = 206
    setHeader("Content-Range", `bytes ${start}-${finish}/${info.size}`)
  }
  setHeader("Content-Type", contentType)
  if (!/^(?:image|video|audio|font)\//.test(contentType)) {
    const encodedName = encodeURIComponent(parts.at(-1)).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16)}`)
    setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedName}`)
  }
  setHeader("X-Content-Type-Options", "nosniff")
  setHeader("Cache-Control", "public, max-age=3600")
  setHeader("Accept-Ranges", "bytes")
  setHeader("Content-Length", info.size === 0 ? 0 : finish - start + 1)
  setHeader("Last-Modified", info.mtime.toUTCString())
  return { status, headers, filename, start, finish, size: info.size }
}

export async function serveUpload(req, res, directory) {
  const result = await resolveUpload(req, directory)
  if (!result) return false
  res.writeHead(result.status, result.headers)
  if (!result.filename || req.method === "HEAD" || result.size === 0) { res.end(); return true }
  const stream = createReadStream(result.filename, { start: result.start, end: result.finish })
  stream.on("error", () => res.destroy())
  res.on("close", () => stream.destroy())
  stream.pipe(res)
  return true
}

/** Next's internal image optimizer can use this route for files added after startup. */
export async function serveUploadResponse(request, directory) {
  const url = new URL(request.url)
  const result = await resolveUpload({ url: url.pathname + url.search, method: request.method, headers: Object.fromEntries(request.headers) }, directory)
  if (!result) return null
  const body = result.filename && request.method !== "HEAD" && result.size > 0
    ? Readable.toWeb(createReadStream(result.filename, { start: result.start, end: result.finish })) : null
  return new Response(body, { status: result.status, headers: result.headers })
}
