import "server-only"
import fs from "node:fs/promises"
import path from "node:path"
import { MediaUploadError } from "./media-upload"

export function mediaPathParts(value: string): string[] {
  if (typeof value !== "string" || value.length > 2048 || /[\\:\u0000-\u001f]/.test(value))
    throw new MediaUploadError("admin.media.unsafe_path")
  const parts = value.split("/")
  if (!parts.length || parts.length > 16 || parts.some(part => !part || part.startsWith(".") || /%2e|%2f|%5c/i.test(part)))
    throw new MediaUploadError("admin.media.unsafe_path")
  return parts
}
export async function mediaRoot(create = false, directory = path.join(process.cwd(), "public", "uploads")) {
  if (create) await fs.mkdir(directory, { recursive: true })
  const root = await fs.realpath(directory)
  if (!(await fs.stat(root)).isDirectory()) throw new MediaUploadError("admin.media.unsafe_path")
  return root
}
/** Reject symlinks at every child component, including an existing target file. */
export async function checkedMediaPath(root: string, relative: string, allowMissingFile = false): Promise<string> {
  const parts = mediaPathParts(relative)
  let filename = root
  for (const [index, part] of parts.entries()) {
    filename = path.join(filename, part)
    try {
      const info = await fs.lstat(filename)
      if (info.isSymbolicLink() || (index < parts.length - 1 && !info.isDirectory()) || (index === parts.length - 1 && !info.isFile()))
        throw new MediaUploadError("admin.media.unsafe_path")
    } catch (error) {
      if (allowMissingFile && index === parts.length - 1 && (error as NodeJS.ErrnoException).code === "ENOENT") break
      throw error
    }
  }
  const relativePath = path.relative(root, filename)
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) throw new MediaUploadError("admin.media.unsafe_path")
  return filename
}
export async function prepareMediaDirectory(root: string, relative: string) {
  let directory = root
  for (const part of mediaPathParts(relative)) {
    directory = path.join(directory, part)
    await fs.mkdir(directory, { recursive: true })
    const info = await fs.lstat(directory)
    if (!info.isDirectory() || info.isSymbolicLink()) throw new MediaUploadError("admin.media.unsafe_path")
  }
}
