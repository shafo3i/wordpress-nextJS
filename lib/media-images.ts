import { safeMediaUrl } from "./post-media"

export type ImageAsset = {
  url: string
  width?: number
  height?: number
  srcSet?: string
}

export function isOptimizableUpload(src: string): boolean {
  if (
    !src.startsWith("/uploads/") ||
    /[?#\\\u0000-\u0020]/.test(src) ||
    !/\.(?:jpe?g|png|gif|webp|avif)$/i.test(src)
  )
    return false
  try {
    return src
      .split("/")
      .slice(2)
      .every(
        (part) =>
          part &&
          ![".", ".."].includes(decodeURIComponent(part)) &&
          !/[\/\\]/.test(decodeURIComponent(part))
      )
  } catch {
    return false
  }
}

function uploadPath(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !value ||
    value.startsWith("/") ||
    /[\\<>"'?#\u0000-\u001f]/.test(value)
  )
    return
  if (
    value
      .split("/")
      .some(
        (part) =>
          !part || part === "." || part === ".." || /%2e|%2f|%5c/i.test(part)
      )
  )
    return
  return `/uploads/${value
    .split("/")
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part))
      } catch {
        return encodeURIComponent(part)
      }
    })
    .join("/")}`
}

export function resolveAttachmentImage(
  guid: string,
  file: string | undefined,
  rawMetadata?: string
): ImageAsset {
  const imported = guid.includes("/wp-content/uploads/")
    ? `/uploads/${guid.split("/wp-content/uploads/")[1]}`
    : guid
  const url = uploadPath(file) || safeMediaUrl(imported) || ""
  let metadata: { width?: unknown; height?: unknown; sizes?: unknown } = {}
  try {
    const parsed: unknown = JSON.parse(rawMetadata || "{}")
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      metadata = parsed
  } catch {}
  const dimension = (value: unknown) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 100000
      ? Math.round(value)
      : undefined
  const width = dimension(metadata.width),
    height = dimension(metadata.height)
  const candidates = new Map<number, string>()
  // Only uncropped variants with the original aspect ratio are interchangeable.
  if (file && width && height) {
    const folder = file.includes("/")
      ? file.slice(0, file.lastIndexOf("/") + 1)
      : ""
    for (const raw of Object.values(
      metadata.sizes && typeof metadata.sizes === "object" ? metadata.sizes : {}
    )) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue
      const size = raw as { width?: unknown; height?: unknown; file?: unknown }
      const w = dimension(size?.width),
        h = dimension(size?.height),
        path =
          typeof size?.file === "string"
            ? uploadPath(folder + size.file)
            : undefined
      if (path && w && h && Math.abs(w / h - width / height) < 0.03)
        candidates.set(w, path)
    }
    candidates.set(width, url)
  }
  const srcSet =
    candidates.size > 1
      ? [...candidates]
          .sort((a, b) => a[0] - b[0])
          .map(([w, path]) => `${path} ${w}w`)
          .join(", ")
      : undefined
  return { url, width, height, srcSet }
}
