import "server-only"
import { eq, like, asc, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpOptions } from "@/db/schema/cms-options"
import { verifyAdmin, verifyPostEditor } from "@/lib/authMIddleware"
import { checkCmsRateLimit } from "@/lib/rate-limit"
import { encryptValue, decryptValue } from "@/lib/encryption"
import { MediaUploadError } from "@/lib/media-upload"
import { mediaStorageSettingsSchema, mediaStoragePatchSchema, type MediaStorageAdminView } from "@/db/schema/cms-media-storage"
import { createS3StorageClient, type S3StorageConfig } from "@/lib/s3-storage"

const optionName = "cms_media_storage"
async function readStorage(database: DB) {
  const [row] = await database.select({ value: wpOptions.optionValue }).from(wpOptions).where(eq(wpOptions.optionName, optionName)).limit(1)
  const raw = row?.value ? JSON.parse(row.value) : {}
  return { settings: mediaStorageSettingsSchema.parse(raw.settings || {}), accessKeyId: typeof raw.accessKeyId === "string" ? raw.accessKeyId : "", secretAccessKey: typeof raw.secretAccessKey === "string" ? raw.secretAccessKey : "" }
}
export async function getMediaStorageAdminView(database: DB = db): Promise<MediaStorageAdminView> {
  await verifyAdmin()
  const stored = await readStorage(database)
  return { ...stored.settings, credentialsConfigured: !!(stored.accessKeyId && stored.secretAccessKey) }
}
export async function isS3UploadAvailable(database: DB = db) {
  await verifyPostEditor()
  try { const stored = await readStorage(database); return stored.settings.enabled && !!stored.accessKeyId && !!stored.secretAccessKey } catch { return false }
}
export async function saveMediaStorage(input: unknown, database: DB = db) {
  const actor = await verifyAdmin()
  await checkCmsRateLimit(actor.user.id, "write")
  const patch = mediaStoragePatchSchema.parse(input)
  await database.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:media-storage'))`)
    const previous = await readStorage(tx as unknown as DB)
    const accessKeyId = patch.accessKeyId ? encryptValue(patch.accessKeyId) : previous.accessKeyId
    const secretAccessKey = patch.secretAccessKey ? encryptValue(patch.secretAccessKey) : previous.secretAccessKey
    if (patch.settings.enabled && (!accessKeyId || !secretAccessKey)) throw new MediaUploadError("admin.storage.credentials_required")
    const value = JSON.stringify({ settings: patch.settings, accessKeyId, secretAccessKey })
    const [row] = await tx.select({ id: wpOptions.optionId }).from(wpOptions).where(eq(wpOptions.optionName, optionName)).limit(1)
    if (row) await tx.update(wpOptions).set({ optionValue: value, autoload: "no" }).where(eq(wpOptions.optionId, row.id))
    else await tx.insert(wpOptions).values({ optionName, optionValue: value, autoload: "no" })
  })
  return getMediaStorageAdminView(database)
}
export async function getS3StorageConfig(database: DB = db): Promise<S3StorageConfig> {
  const stored = await readStorage(database)
  if (!stored.accessKeyId || !stored.secretAccessKey || !stored.settings.endpoint || !stored.settings.bucket) throw new MediaUploadError("admin.storage.unavailable")
  return { ...stored.settings, accessKeyId: decryptValue(stored.accessKeyId), secretAccessKey: decryptValue(stored.secretAccessKey) }
}
export async function testMediaStorageConnection(database: DB = db) {
  const actor = await verifyAdmin()
  await checkCmsRateLimit(actor.user.id, "sync")
  const config = await getS3StorageConfig(database)
  const { HeadBucketCommand } = await import("@aws-sdk/client-s3")
  const connection = await createS3StorageClient(config)
  try { await connection.client.send(new HeadBucketCommand({ Bucket: config.bucket }), { abortSignal: AbortSignal.timeout(20000) }) }
  finally { connection.close() }
}
/** Explicit, bounded retry. No filesystem or bucket scans and no background worker. */
export async function retryMediaStorageCleanup(database: DB = db) {
  const actor = await verifyAdmin()
  await checkCmsRateLimit(actor.user.id, "sync")
  const rows = await database.select({ id: wpOptions.optionId, value: wpOptions.optionValue }).from(wpOptions)
    .where(like(wpOptions.optionName, "cms\\_media\\_cleanup\\_%")).orderBy(asc(wpOptions.optionId)).limit(20)
  let completed = 0, failed = 0
  const { deleteS3MediaObjects } = await import("./media-object-storage.service")
  for (const row of rows) try {
    if (row.value.length > 100000) throw new Error()
    const item = JSON.parse(row.value)
    if (typeof item.url !== "string") throw new Error()
    await deleteS3MediaObjects(item.storage, item.url, database)
    await database.delete(wpOptions).where(eq(wpOptions.optionId, row.id))
    completed++
  } catch { failed++ }
  return { completed, failed }
}
