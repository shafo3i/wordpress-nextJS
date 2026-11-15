import { checkCmsRateLimit } from "@/lib/rate-limit";
import "server-only"
import fs from "node:fs/promises"
import path from "node:path"
import { randomUUID, createHash } from "node:crypto"
import { hostname } from "node:os"
import sharp from "sharp"
import { db } from "@/db"
import { wpPosts, wpPostmeta, wpOptions } from "@/db/schema"
import { eq, and, sql, inArray, gt, asc } from "drizzle-orm"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  mediaRoot,
  checkedMediaPath,
  mediaPathParts,
  prepareMediaDirectory,
} from "@/lib/media-files"
import {
  mediaRegenerateSchema,
  orphanCleanupSchema,
  storageInventorySchema,
} from "@/db/schema/cms-tools"
import { MAX_MEDIA_IMAGE_PIXELS } from "@/lib/media-upload"
export interface ImageSizeConfig {
  name: string
  width: number
  height: number
  crop: boolean
}
export const THEME_THUMBNAIL_SIZES: ImageSizeConfig[] = [
  { name: "thumbnail", width: 150, height: 150, crop: true },
  { name: "medium", width: 600, height: 400, crop: false },
  { name: "large", width: 1024, height: 768, crop: false },
  { name: "hero", width: 1200, height: 675, crop: true },
]
export interface MediaOverviewStats {
  attachmentCount: number
  physicalFilesCount: number | null
  totalDiskUsageBytes: number | null
  scannedAt?: string | null
  uploadsDirWritable: boolean
  configuredSizes: ImageSizeConfig[]
}
export interface OrphanFileItem {
  relativePath: string
  sizeBytes: number
  modifiedAt: string
  previewUrl: string
}
export interface OrphanScanResult {
  totalFiles: number
  inUseCount: number
  orphanCount: number
  reclaimableBytes: number
  orphanFiles: OrphanFileItem[]
}
async function toolsRoot() {
  if (
    (
      await fs.lstat(path.join(process.cwd(), "public", "uploads"))
    ).isSymbolicLink()
  )
    throw new Error("unsafe_uploads_root")
  return mediaRoot()
}
async function walk(root: string, relative = ""): Promise<OrphanFileItem[]> {
  const directory = relative
    ? path.join(root, ...mediaPathParts(relative))
    : root
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: OrphanFileItem[] = []
  for (const entry of entries) {
    if (
      entry.name.startsWith(".") ||
      entry.isSymbolicLink() ||
      entry.name === "video-posters"
    )
      continue
    const name = relative ? `${relative}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (name.split("/").length >= 16) throw new Error("tools_job_too_large")
      files.push(...(await walk(root, name)))
    } else if (entry.isFile()) {
      const filename = await checkedMediaPath(root, name),
        stat = await fs.stat(filename)
      files.push({
        relativePath: name,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        previewUrl: `/uploads/${name.split("/").map(encodeURIComponent).join("/")}`,
      })
    }
    if (files.length > 100000) throw new Error("tools_job_too_large")
  }
  return files
}
export async function getStoredStorageInventory() {
  await verifyAdmin()
  const [stored] = await db
    .select({ optionValue: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, "pressforge_storage_inventory"))
    .limit(1)
  if ((stored?.optionValue?.length || 0) > 2048) return null
  try {
    const parsed = storageInventorySchema.safeParse(
      JSON.parse(stored?.optionValue || "null")
    )
    return parsed.success && parsed.data.scope === storageScope()
      ? parsed.data
      : null
  } catch {
    return null
  }
}

function storageScope() {
  return createHash("sha256")
    .update(hostname())
    .update("\0")
    .update(path.resolve("public", "uploads"))
    .digest("hex")
}

export async function getMediaOverviewStats({
  scanFiles = false,
}: { scanFiles?: boolean } = {}): Promise<MediaOverviewStats> {
  const rateActor = await verifyAdmin()
  if (scanFiles) await checkCmsRateLimit(rateActor.user.id, "scan");
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wpPosts)
    .where(eq(wpPosts.postType, "attachment"))
  let files: OrphanFileItem[] = [],
    writable = false
  let inventory: ReturnType<typeof storageInventorySchema.parse> | null = null
  if (!scanFiles) inventory = await getStoredStorageInventory()
  let completed = false
  try {
    const root = await toolsRoot()
    if (scanFiles) {
      files = await walk(root)
      completed = true
    }
    await fs.access(root, fs.constants.W_OK)
    writable = true
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== "ENOENT" &&
      (error as NodeJS.ErrnoException).code !== "EACCES"
    )
      throw error
  }
  if (scanFiles) {
    if (!completed) throw new Error("storage_scan_unavailable")
    inventory = storageInventorySchema.parse({
      scope: storageScope(),
      fileCount: files.length,
      totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
      scannedAt: new Date().toISOString(),
    })
    const optionValue = JSON.stringify(inventory)
    await db
      .insert(wpOptions)
      .values({
        optionName: "pressforge_storage_inventory",
        optionValue,
        autoload: "no",
      })
      .onConflictDoUpdate({
        target: wpOptions.optionName,
        set: { optionValue },
      })
  }
  return {
    attachmentCount: row?.count || 0,
    physicalFilesCount: inventory?.fileCount ?? null,
    totalDiskUsageBytes: inventory?.totalBytes ?? null,
    scannedAt: inventory?.scannedAt ?? null,
    uploadsDirWritable: writable,
    configuredSizes: THEME_THUMBNAIL_SIZES,
  }
}
/** Keep old callers explicit: production maintenance must not invent editorial data. */
export async function seedSampleMedia(): Promise<{ createdCount: number }> {
  await verifyAdmin()
  throw new Error("demo_media_disabled")
}
export async function regenerateThumbnails(options: {
  generateWebp?: boolean
  onlyMissing?: boolean
  attachmentIds?: number[]
  afterId?: number
}): Promise<{
  processed: number
  totalSizesGenerated: number
  nextAfterId?: number
  details: Array<{
    id: number
    title: string
    sizesCreated: string[]
    success: boolean
    error?: string
  }>
}> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "regenerate");
  const input = mediaRegenerateSchema.parse(options)
  const root = await toolsRoot()
  const conditions = [
    eq(wpPosts.postType, "attachment"),
    sql`${wpPosts.postMimeType} LIKE 'image/%'`,
  ]
  if (input.attachmentIds)
    conditions.push(inArray(wpPosts.id, input.attachmentIds.map(BigInt)))
  if (input.afterId) conditions.push(gt(wpPosts.id, BigInt(input.afterId)))
  const attachments = await db
    .select({ id: wpPosts.id, title: wpPosts.postTitle })
    .from(wpPosts)
    .where(and(...conditions))
    .orderBy(asc(wpPosts.id))
    .limit(26)
  const details: Array<{
    id: number
    title: string
    sizesCreated: string[]
    success: boolean
    error?: string
  }> = []
  let totalSizesGenerated = 0
  for (const attachment of attachments.slice(0, 25)) {
    const id = Number(attachment.id)
    if (!Number.isSafeInteger(id)) throw new Error("invalid_attachment")
    try {
      const meta = await db
        .select({ key: wpPostmeta.metaKey, value: wpPostmeta.metaValue })
        .from(wpPostmeta)
        .where(
          and(
            eq(wpPostmeta.postId, attachment.id),
            inArray(wpPostmeta.metaKey, [
              "_wp_attached_file",
              "_wp_attachment_metadata",
            ])
          )
        )
      const file = meta.find((item) => item.key === "_wp_attached_file")?.value
      if (!file) throw new Error("invalid_media_file")
      const source = await checkedMediaPath(root, file),
        sourceStat = await fs.stat(source)
      if (sourceStat.size > 32 * 1024 * 1024)
        throw new Error("invalid_media_file")
      const bytes = await fs.readFile(source),
        info = await sharp(bytes, {
          limitInputPixels: MAX_MEDIA_IMAGE_PIXELS,
        }).metadata()
      if (
        !["jpeg", "png", "webp", "avif", "gif"].includes(info.format || "") ||
        !info.width ||
        !info.height ||
        (info.pages || 1) > 1
      )
        throw new Error("unsupported_media")
      const previous = meta.find(
        (item) => item.key === "_wp_attachment_metadata"
      )?.value
      let metadata: Record<string, unknown> = {}
      try {
        const raw = JSON.parse(previous || "{}")
        if (raw && typeof raw === "object" && !Array.isArray(raw))
          metadata = raw
      } catch {
        /* Legacy PHP metadata is not copied into new JSON. */
      }
      const sizes: Record<string, unknown> = {}
      if (
        metadata.sizes &&
        typeof metadata.sizes === "object" &&
        !Array.isArray(metadata.sizes)
      )
        for (const [key, value] of Object.entries(metadata.sizes)) {
          if (
            value &&
            typeof value === "object" &&
            "file" in value &&
            typeof value.file === "string" &&
            !/[\\/]/.test(value.file)
          ) {
            try {
              mediaPathParts(value.file)
              sizes[key] = value
            } catch {}
          }
        }
      const sizesCreated: string[] = []
      const directory = path.posix.dirname(file),
        stem = path.posix.parse(file).name
      for (const size of THEME_THUMBNAIL_SIZES) {
        const filename = `${stem}-${size.width}x${size.height}.${info.format === "jpeg" ? "jpg" : info.format}`
        const relative =
          directory === "." ? filename : `${directory}/${filename}`
        const target = await checkedMediaPath(root, relative, true)
        const resize = {
          width: size.width,
          height: size.height,
          fit: size.crop ? ("cover" as const) : ("inside" as const),
          withoutEnlargement: true,
        }
        let exists = false
        try {
          await fs.stat(target)
          exists = true
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
        }
        let dimensions: { width?: number; height?: number }
        if (!input.onlyMissing || !exists) {
          const image = await sharp(bytes, {
            limitInputPixels: MAX_MEDIA_IMAGE_PIXELS,
          })
            .resize(resize)
            .toBuffer({ resolveWithObject: true })
          await fs.writeFile(target, image.data)
          dimensions = image.info
          sizesCreated.push(size.name)
          totalSizesGenerated++
        } else
          dimensions = await sharp(target, {
            limitInputPixels: MAX_MEDIA_IMAGE_PIXELS,
          }).metadata()
        sizes[size.name] = {
          file: filename,
          width: dimensions.width,
          height: dimensions.height,
          mimeType: `image/${info.format}`,
        }
        if (input.generateWebp && info.format !== "webp") {
          const webp =
            directory === "."
              ? `${stem}-${size.width}x${size.height}.webp`
              : `${directory}/${stem}-${size.width}x${size.height}.webp`
          const destination = await checkedMediaPath(root, webp, true)
          let hasWebp = false
          try {
            await fs.stat(destination)
            hasWebp = true
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
          }
          if (!input.onlyMissing || !hasWebp) {
            await fs.writeFile(
              destination,
              await sharp(bytes, { limitInputPixels: MAX_MEDIA_IMAGE_PIXELS })
                .resize(resize)
                .webp({ quality: 82 })
                .toBuffer()
            )
            totalSizesGenerated++
          }
        }
      }
      const metaValue = JSON.stringify({
        ...metadata,
        file,
        width: info.width,
        height: info.height,
        sizes,
        filesize: sourceStat.size,
      })
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT "ID" FROM wp_posts WHERE "ID"=${attachment.id} AND post_type='attachment' FOR UPDATE`
        )
        await tx
          .delete(wpPostmeta)
          .where(
            and(
              eq(wpPostmeta.postId, attachment.id),
              eq(wpPostmeta.metaKey, "_wp_attachment_metadata")
            )
          )
        await tx.insert(wpPostmeta).values({
          postId: attachment.id,
          metaKey: "_wp_attachment_metadata",
          metaValue,
        })
      })
      details.push({
        id,
        title: attachment.title || "",
        sizesCreated,
        success: true,
      })
    } catch {
      details.push({
        id,
        title: attachment.title || "",
        sizesCreated: [],
        success: false,
        error: "admin.tools.media.file_failed",
      })
    }
  }
  return {
    processed: details.length,
    totalSizesGenerated,
    details,
    ...(attachments.length > 25
      ? { nextAfterId: Number(attachments[24].id) }
      : {}),
  }
}
async function scan(): Promise<OrphanScanResult> {
  let root: string
  try {
    root = await toolsRoot()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return {
        totalFiles: 0,
        inUseCount: 0,
        orphanCount: 0,
        reclaimableBytes: 0,
        orphanFiles: [],
      }
    throw error
  }
  const files = await walk(root)
  const [meta, options, posts] = await Promise.all([
    db
      .select({ metaValue: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .limit(100001),
    db
      .select({ optionValue: wpOptions.optionValue })
      .from(wpOptions)
      .limit(100001),
    db
      .select({ content: wpPosts.postContent, guid: wpPosts.guid })
      .from(wpPosts)
      .limit(100001),
  ])
  if ([meta, options, posts].some((rows) => rows.length > 100000))
    throw new Error("tools_job_too_large")
  const strings = [
    ...meta.map((row) => row.metaValue || ""),
    ...options.map((row) => row.optionValue),
    ...posts.flatMap((row) => [row.content || "", row.guid || ""]),
  ]
  let size = 0
  const references = strings
    .map((value) => {
      size += Buffer.byteLength(value)
      if (size > 100 * 1024 * 1024) throw new Error("tools_job_too_large")
      let decoded = value
      try {
        decoded = decodeURIComponent(value)
      } catch {}
      return `${value}\n${decoded}`.replaceAll("\\/", "/")
    })
    .join("\n")
  const orphans = files.filter((file) => {
    const name = path.posix.basename(file.relativePath)
    const originalStem = name.replace(/-\d+x\d+\.[^.]+$/, "")
    return (
      !references.includes(file.relativePath) &&
      !references.includes(name) &&
      !(originalStem !== name && references.includes(originalStem + "."))
    )
  })
  return {
    totalFiles: files.length,
    inUseCount: files.length - orphans.length,
    orphanCount: orphans.length,
    reclaimableBytes: orphans.reduce((sum, file) => sum + file.sizeBytes, 0),
    orphanFiles: orphans.slice(0, 100),
  }
}
export async function scanOrphanMedia(): Promise<OrphanScanResult> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "scan");
  return scan()
}
export async function cleanOrphanMedia(
  filePaths: string[],
  action: "quarantine" | "delete"
): Promise<{
  cleanedCount: number
  reclaimedBytes: number
  actionTaken: "quarantine" | "delete"
  failedCount: number
}> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "cleanup");
  const input = orphanCleanupSchema.parse({ filePaths, action })
  const root = await toolsRoot()
  const requested = [...new Set(input.filePaths)]
  for (const relative of requested) mediaPathParts(relative)
  const candidates = new Map(
    (await scan()).orphanFiles.map((file) => [file.relativePath, file])
  )
  const files = await Promise.all(
    requested.map(async (relative) => {
      const evidence = candidates.get(relative)
      if (!evidence) throw new Error("media_in_use")
      const filename = await checkedMediaPath(root, relative),
        stat = await fs.stat(filename)
      if (
        stat.size !== evidence.sizeBytes ||
        stat.mtime.toISOString() !== evidence.modifiedAt
      )
        throw new Error("media_changed")
      return { relative, filename, size: stat.size, modified: stat.mtimeMs }
    })
  )
  let cleanedCount = 0,
    reclaimedBytes = 0,
    failedCount = 0
  const batch = randomUUID()
  let quarantine = ""
  if (input.action === "quarantine") {
    quarantine = path.join(root, ".quarantine")
    await fs.mkdir(quarantine, { recursive: true })
    if (
      (await fs.lstat(quarantine)).isSymbolicLink() ||
      (await fs.realpath(quarantine)) !== quarantine
    )
      throw new Error("unsafe_quarantine")
  }
  for (const file of files) {
    try {
      await checkedMediaPath(root, file.relative)
      const current = await fs.stat(file.filename)
      if (current.size !== file.size || current.mtimeMs !== file.modified)
        throw new Error("media_changed")
      if (input.action === "quarantine") {
        const destination = `${batch}/${file.relative}`
        await prepareMediaDirectory(quarantine, path.posix.dirname(destination))
        await fs.rename(
          file.filename,
          await checkedMediaPath(quarantine, destination, true)
        )
      } else {
        await fs.unlink(file.filename)
        reclaimedBytes += file.size
      }
      cleanedCount++
    } catch {
      failedCount++
    }
  }
  return {
    cleanedCount,
    reclaimedBytes,
    failedCount,
    actionTaken: input.action,
  }
}
