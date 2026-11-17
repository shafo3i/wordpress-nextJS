import "server-only"
import { randomUUID } from "node:crypto"
import { db, type DB } from "@/db"
import { MediaUploadError } from "@/lib/media-upload"
import { createS3StorageClient } from "@/lib/s3-storage"
import { getS3StorageConfig } from "./media-storage.service"
import { mediaStorageSettingsSchema } from "@/db/schema/cms-media-storage"

export type S3MediaIdentity = {
  provider: "s3"; endpoint: string; region: string; bucket: string; publicBaseUrl: string;
  folder: string; key: string; objects: string[];
}
function objectUrl(base: string, key: string) {
  return `${base.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`
}
export async function openS3MediaUpload(relativeDir: string, filename: string, database: DB = db) {
  const config = await getS3StorageConfig(database)
  if (!config.enabled) throw new MediaUploadError("admin.storage.unavailable")
  const folder = [config.prefix, "pressforge", randomUUID(), relativeDir].filter(Boolean).join("/")
  const identity: S3MediaIdentity = { provider: "s3", endpoint: config.endpoint, region: config.region, bucket: config.bucket, publicBaseUrl: config.publicBaseUrl, folder, key: `${folder}/${filename}`, objects: [] }
  const connection = await createS3StorageClient(config)
  const { PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3")
  return {
    identity,
    url: (name: string) => objectUrl(config.publicBaseUrl, `${folder}/${name}`),
    async write(name: string, bytes: Buffer, mimeType: string) {
      if (/[\\/\u0000-\u001f]/.test(name) || name.startsWith(".")) throw new MediaUploadError("admin.media.unsafe_path")
      const key = `${folder}/${name}`
      identity.objects.push(key)
      await connection.client.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: bytes, ContentLength: bytes.length, ContentType: mimeType,
        ContentDisposition: /^(image|video|audio|font)\//.test(mimeType) ? "inline" : "attachment",
        CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(30000) })
    },
    async cleanup() {
      for (const key of identity.objects) try {
        await connection.client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }), { abortSignal: AbortSignal.timeout(15000) })
      } catch { console.warn("Object upload cleanup incomplete") }
    },
    close: connection.close,
  }
}

/** Credentials come from current server settings; deletion keys come only from validated attachment metadata. */
export async function deleteS3MediaObjects(raw: unknown, originalUrl: string, database: DB = db) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new MediaUploadError("admin.media.unsafe_path")
  const value = raw as Partial<S3MediaIdentity>
  const folder = value.folder
  const settings = mediaStorageSettingsSchema.parse({ enabled: true, endpoint: value.endpoint, region: value.region, bucket: value.bucket, publicBaseUrl: value.publicBaseUrl, prefix: "" })
  if (value.provider !== "s3" || typeof folder !== "string" || !/^(?:[\w-]+\/)*pressforge\/[\da-f-]{36}\/\d{4}\/\d{2}$/.test(folder) ||
      typeof value.key !== "string" || !value.key.startsWith(`${folder}/`) || !Array.isArray(value.objects) || !value.objects.length || value.objects.length > 64 ||
      value.objects.some(key => typeof key !== "string" || !key.startsWith(`${folder}/`) || /[\\\u0000-\u001f]/.test(key) || key.slice(folder.length + 1).includes("/") || key.split("/").some(part => !part || part.startsWith(".") || /%2e|%2f|%5c/i.test(part))) ||
      !value.objects.includes(value.key) || objectUrl(settings.publicBaseUrl, value.key) !== originalUrl) throw new MediaUploadError("admin.media.unsafe_path")
  const config = await getS3StorageConfig(database)
  if (config.endpoint !== settings.endpoint || config.region !== settings.region || config.bucket !== settings.bucket) throw new MediaUploadError("admin.storage.unavailable")
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
  const connection = await createS3StorageClient(config)
  try {
    for (const key of value.objects) await connection.client.send(new DeleteObjectCommand({ Bucket: settings.bucket, Key: key }), { abortSignal: AbortSignal.timeout(15000) })
  } finally { connection.close() }
}
