import "server-only"
import { execFile } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { MediaUploadError, MAX_MEDIA_UPLOAD_BYTES } from "@/lib/media-upload"

let active = 0
/** Process only already-validated upload bytes; ffmpeg never receives a remote URL. */
export async function createUploadedVideoPoster(bytes: Buffer, extension: string) {
  if (active >= 2) throw new MediaUploadError("admin.storage.poster_busy")
  active++
  try { return await renderPoster(bytes, extension) } finally { active-- }
}
async function renderPoster(bytes: Buffer, extension: string) {
  if (!/^(mp4|m4v|webm|ogv)$/.test(extension) || !bytes.length || bytes.length > MAX_MEDIA_UPLOAD_BYTES) throw new MediaUploadError("admin.storage.poster_failed")
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pressforge-video-"))
  const filename = path.join(directory, `source.${extension}`)
  try {
    await fs.writeFile(filename, bytes, { flag: "wx", mode: 0o600 })
    return await new Promise<Buffer>((resolve, reject) => execFile("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-nostdin", "-max_alloc", "67108864", "-threads", "1",
      "-protocol_whitelist", "file,pipe", "-format_whitelist", "mov,matroska,webm,ogg", "-i", filename,
      "-an", "-sn", "-dn", "-frames:v", "1", "-vf", "scale=960:540:force_original_aspect_ratio=decrease,thumbnail=10",
      "-threads", "1", "-f", "image2pipe", "-c:v", "mjpeg", "pipe:1",
    ], { encoding: "buffer", timeout: 15000, maxBuffer: 2 * 1024 * 1024, windowsHide: true }, (error, result) => {
      if (error || !result.length) reject(new MediaUploadError("admin.storage.poster_failed"))
      else resolve(result)
    }))
  } finally {
    await fs.unlink(filename).catch(() => {})
    await fs.rmdir(directory).catch(() => {})
  }
}
