export const MAX_MEDIA_UPLOAD_BYTES = 32 * 1024 * 1024
export const MAX_MEDIA_UPLOAD_FILES = 20
export const MAX_MEDIA_IMAGE_PIXELS = 40_000_000
export class MediaUploadError extends Error {
  constructor(public readonly key: string) { super(key) }
}
function invalid(): never { throw new MediaUploadError("admin.media.invalid_upload") }
const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
function isoContainer(bytes: Uint8Array, brands: string[]) {
  if (bytes.length < 24 || ascii(bytes, 4, 8) !== "ftyp") return false
  const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0)
  if (size < 24 || size > bytes.length || size > 4096) return false
  for (let i = 8; i + 4 <= size; i += 4) if (i !== 12 && brands.includes(ascii(bytes, i, i + 4))) return true
  return false
}
/** Container checks do not replace codec validation or malware scanning. */
export function validateVideoUpload(name: string, mime: string, bytes: Uint8Array): void {
  const ext = name.split(".").pop()?.toLowerCase()
  const expected = ({ mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", ogv: "video/ogg" } as Record<string, string>)[ext || ""]
  if (!mime.startsWith("video/") && !expected) return
  if (!expected || expected !== mime) invalid()
  const valid = mime === "video/mp4" ? isoContainer(bytes, ["isom", "iso2", "iso3", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "dash"])
    : mime === "video/webm" ? bytes.length >= 12 && ascii(bytes, 0, 4) === "\x1a\x45\xdf\xa3" && ascii(bytes, 4, 4096).includes("webm")
    : bytes.length >= 27 && ascii(bytes, 0, 4) === "OggS"
  if (!valid) invalid()
}
type UploadPolicy = { mimeType: string; kind: "image" | "video" | "audio" | "document" | "font"; imageFormat?: "jpeg" | "png" | "webp" | "gif" | "avif" }
const formats: Record<string, UploadPolicy> = {
  jpg: { mimeType: "image/jpeg", kind: "image", imageFormat: "jpeg" }, jpeg: { mimeType: "image/jpeg", kind: "image", imageFormat: "jpeg" },
  png: { mimeType: "image/png", kind: "image", imageFormat: "png" }, webp: { mimeType: "image/webp", kind: "image", imageFormat: "webp" },
  gif: { mimeType: "image/gif", kind: "image", imageFormat: "gif" }, avif: { mimeType: "image/avif", kind: "image", imageFormat: "avif" },
  mp4: { mimeType: "video/mp4", kind: "video" }, m4v: { mimeType: "video/mp4", kind: "video" },
  webm: { mimeType: "video/webm", kind: "video" }, ogv: { mimeType: "video/ogg", kind: "video" },
  mp3: { mimeType: "audio/mpeg", kind: "audio" }, m4a: { mimeType: "audio/mp4", kind: "audio" },
  wav: { mimeType: "audio/wav", kind: "audio" }, ogg: { mimeType: "audio/ogg", kind: "audio" },
  aac: { mimeType: "audio/aac", kind: "audio" }, flac: { mimeType: "audio/flac", kind: "audio" },
  pdf: { mimeType: "application/pdf", kind: "document" }, txt: { mimeType: "text/plain", kind: "document" }, csv: { mimeType: "text/csv", kind: "document" },
  doc: { mimeType: "application/msword", kind: "document" }, xls: { mimeType: "application/vnd.ms-excel", kind: "document" }, ppt: { mimeType: "application/vnd.ms-powerpoint", kind: "document" },
  docx: { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "document" },
  xlsx: { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "document" },
  pptx: { mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "document" },
  woff: { mimeType: "font/woff", kind: "font" }, woff2: { mimeType: "font/woff2", kind: "font" },
}
export function validateMediaUpload(name: string, mime: string, bytes: Uint8Array): UploadPolicy & { extension: string } {
  if (!name || name.length > 255 || /[\/\\\u0000-\u001f]/.test(name) || !bytes.length || bytes.length > MAX_MEDIA_UPLOAD_BYTES) invalid()
  const extension = name.split(".").pop()?.toLowerCase() || ""
  const policy = Object.hasOwn(formats, extension) ? formats[extension] : undefined
  const aliases: Record<string,string> = { "image/jpg":"image/jpeg", "image/pjpeg":"image/jpeg", "audio/x-wav":"audio/wav", "audio/wave":"audio/wav", "audio/x-m4a":"audio/mp4", "audio/mp3":"audio/mpeg", "video/x-m4v":"video/mp4", "application/font-woff":"font/woff", "application/x-font-woff":"font/woff" };
  const claimed = Object.hasOwn(aliases, mime) ? aliases[mime] : mime;
  if (!policy || (claimed && claimed !== "application/octet-stream" && claimed !== policy.mimeType)) invalid()
  const header = ascii(bytes, 0, 12)
  let valid = true
  if (policy.kind === "video") validateVideoUpload(name, policy.mimeType, bytes)
  else if (policy.kind === "image") valid = policy.imageFormat === "jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : policy.imageFormat === "png" ? header.startsWith("\x89PNG\r\n\x1a\n")
    : policy.imageFormat === "webp" ? header.startsWith("RIFF") && header.slice(8) === "WEBP"
    : policy.imageFormat === "gif" ? /^(?:GIF87a|GIF89a)/.test(header) : isoContainer(bytes, ["avif", "avis"])
  else if (extension === "m4a") valid = isoContainer(bytes, ["M4A ", "M4B ", "isom", "iso2", "mp42"])
  else if (extension === "mp3") valid = header.startsWith("ID3") || (bytes[0] === 255 && (bytes[1] & 224) === 224)
  else if (extension === "aac") valid = bytes[0] === 255 && (bytes[1] & 246) === 240
  else if (extension === "wav") valid = header.startsWith("RIFF") && header.slice(8) === "WAVE"
  else if (extension === "ogg") valid = bytes.length >= 27 && header.startsWith("OggS")
  else if (extension === "flac") valid = header.startsWith("fLaC")
  else if (extension === "pdf") valid = header.startsWith("%PDF-")
  else if (["doc", "xls", "ppt"].includes(extension)) valid = header.startsWith("\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
  else if (["docx", "xlsx", "pptx"].includes(extension)) valid = header.startsWith("PK\x03\x04")
  else if (extension === "woff") valid = header.startsWith("wOFF")
  else if (extension === "woff2") valid = header.startsWith("wOF2")
  if (!valid) invalid()
  return { ...policy, extension }
}
