import { checkCmsRateLimit } from "@/lib/rate-limit"
import "server-only"
import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import {
  checkedMediaPath,
  mediaRoot,
  prepareMediaDirectory,
} from "@/lib/media-files"
import { featuredVideoUrl } from "@/lib/featured-video"

const pending = new Map<string, Promise<Buffer>>()
export class VideoThumbnailError extends Error {
  constructor(public status: number) {
    super("video_thumbnail_unavailable")
  }
}

/** Local uploads only: never give ffmpeg a caller-controlled remote URL. */
export async function videoThumbnail(source: string): Promise<Buffer> {
  const safe = featuredVideoUrl(source)
  if (!safe?.startsWith("/uploads/") || /[?#]/.test(safe))
    throw new VideoThumbnailError(400)
  let relative: string
  try {
    relative = decodeURIComponent(safe.slice("/uploads/".length))
  } catch {
    throw new VideoThumbnailError(400)
  }
  const root = await mediaRoot()
  const filename = await checkedMediaPath(root, relative)
  const stat = await fs.stat(filename)
  if (stat.size > 512 * 1024 * 1024 || stat.size === 0)
    throw new VideoThumbnailError(422)
  const key = createHash("sha256")
    .update(`${relative}:${stat.size}:${stat.mtimeMs}`)
    .digest("hex")
  const cached = `video-posters/${key}.jpg`
  try {
    return await fs.readFile(await checkedMediaPath(root, cached))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  const existing = pending.get(key)
  if (existing) return existing
  if (pending.size >= 2) throw new VideoThumbnailError(503)
  const task = (async () => {
    await checkCmsRateLimit("site", "video-extract")
    const image = await new Promise<Buffer>((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-nostdin",
          "-max_alloc",
          "67108864",
          "-threads",
          "1",
          "-protocol_whitelist",
          "file,pipe",
          "-format_whitelist",
          "mov,matroska,webm,ogg",
          "-i",
          filename,
          "-an",
          "-sn",
          "-dn",
          "-frames:v",
          "1",
          "-vf",
          "scale=960:540:force_original_aspect_ratio=decrease,thumbnail=10",
          "-threads",
          "1",
          "-f",
          "image2pipe",
          "-c:v",
          "mjpeg",
          "pipe:1",
        ],
        {
          encoding: "buffer",
          timeout: 15_000,
          maxBuffer: 2 * 1024 * 1024,
          windowsHide: true,
        },
        (error, stdout) => {
          if (error || !stdout.length) reject(new VideoThumbnailError(422))
          else resolve(stdout)
        }
      )
    })
    await prepareMediaDirectory(root, "video-posters")
    const target = await checkedMediaPath(root, cached, true)
    try {
      await fs.writeFile(target, image, { flag: "wx" })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
    }
    return image
  })()
  pending.set(key, task)
  try {
    return await task
  } finally {
    pending.delete(key)
  }
}
