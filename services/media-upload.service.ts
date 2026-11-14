import "server-only";
import { verifyPostEditor } from "@/lib/authMIddleware";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db, type DB } from "@/db";
import { wpPosts, wpPostmeta } from "@/db/schema";
import { validateMediaUpload, MAX_MEDIA_UPLOAD_BYTES, MAX_MEDIA_IMAGE_PIXELS, MediaUploadError } from "@/lib/media-upload";
import { checkedMediaPath, mediaRoot, prepareMediaDirectory } from "@/lib/media-files";
import { THEME_THUMBNAIL_SIZES } from "./media-tools.service";
import type { MediaItem } from "./media.service";

type MediaSize = { file: string; width: number; height: number; mimeType: string };
export async function uploadMediaFile(fileBuffer: Buffer, originalFilename: string, mimeType: string, _authorId?: string, database: DB = db): Promise<MediaItem> {
  const session = await verifyPostEditor();
  const policy = validateMediaUpload(originalFilename, mimeType, fileBuffer);
  let bytes = fileBuffer, width: number | undefined, height: number | undefined;
  if (policy.imageFormat) {
    try {
      const image = sharp(fileBuffer, { animated: true, limitInputPixels: MAX_MEDIA_IMAGE_PIXELS, failOn: "warning" });
      const metadata = await image.metadata();
      const actual = metadata.format === "heif" && metadata.compression === "av1" ? "avif" : metadata.format;
      if (actual !== policy.imageFormat || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_MEDIA_IMAGE_PIXELS || (metadata.pages || 1) > 100)
        throw new Error("Invalid image dimensions or encoding");
      bytes = await image.rotate().toFormat(policy.imageFormat).toBuffer();
      if (bytes.length > MAX_MEDIA_UPLOAD_BYTES) throw new Error("Normalized image is too large");
      const normalized = await sharp(bytes, { limitInputPixels: MAX_MEDIA_IMAGE_PIXELS }).metadata();
      width = normalized.width; height = normalized.pageHeight || normalized.height;
    } catch { throw new MediaUploadError("admin.media.invalid_upload"); }
  }
  const now = new Date();
  const relativeDir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const stem = Array.from(path.parse(originalFilename).name.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "")).slice(0, 48).join("") || "file";
  const uniqueStem = `${stem}-${randomUUID()}`;
  const filename = `${uniqueStem}.${policy.extension}`;
  const relativeFile = `${relativeDir}/${filename}`;
  const root = await mediaRoot(true);
  await prepareMediaDirectory(root, relativeDir);
  const created: string[] = [];
  const sizes: Record<string, MediaSize> = {};
  async function write(name: string, contents: Buffer) {
    const relative = `${relativeDir}/${name}`;
    const filename = await checkedMediaPath(root, relative, true);
    const handle = await fs.open(filename, "wx");
    created.push(relative);
    try { await handle.writeFile(contents); } finally { await handle.close(); }
  }
  try {
    await write(filename, bytes);
    if (policy.imageFormat) for (const size of THEME_THUMBNAIL_SIZES) {
      const resize = { width: size.width, height: size.height, fit: size.crop ? "cover" as const : "inside" as const, withoutEnlargement: true };
      const image = await sharp(bytes, { limitInputPixels: MAX_MEDIA_IMAGE_PIXELS }).resize(resize).toFormat(policy.imageFormat).toBuffer({ resolveWithObject: true });
      const name = `${uniqueStem}-${size.width}x${size.height}.${policy.extension}`;
      await write(name, image.data);
      sizes[size.name] = { file: name, width: image.info.width, height: image.info.height, mimeType: policy.mimeType };
      if (policy.imageFormat !== "webp") {
        const webp = await sharp(bytes, { limitInputPixels: MAX_MEDIA_IMAGE_PIXELS }).resize(resize).webp({ quality: 82 }).toBuffer();
        await write(`${uniqueStem}-${size.width}x${size.height}.webp`, webp);
      }
    }
    const title = path.parse(originalFilename).name.replace(/[-_]/g, " ").slice(0, 2000);
    const id = await database.transaction(async tx => {
      const [inserted] = await tx.insert(wpPosts).values({ postTitle: title, postName: uniqueStem, postType: "attachment", postMimeType: policy.mimeType,
        postStatus: "inherit", guid: `/uploads/${relativeFile}`, postDate: now, postDateGmt: now, postModified: now, postModifiedGmt: now, postAuthor: session.user.id }).returning({ id: wpPosts.id });
      if (!inserted || inserted.id > BigInt(Number.MAX_SAFE_INTEGER)) throw new MediaUploadError("admin.media.invalid_upload");
      await tx.insert(wpPostmeta).values([
        { postId: inserted.id, metaKey: "_wp_attached_file", metaValue: relativeFile },
        { postId: inserted.id, metaKey: "_wp_attachment_metadata", metaValue: JSON.stringify({ width, height, file: relativeFile, filesize: bytes.length, sizes }) },
        { postId: inserted.id, metaKey: "_wp_attachment_image_alt", metaValue: "" },
      ]);
      return Number(inserted.id);
    });
    return { id, title, filename, url: `/uploads/${relativeFile}`, thumbnailUrl: sizes.thumbnail ? `/uploads/${relativeDir}/${sizes.thumbnail.file}` : `/uploads/${relativeFile}`,
      mimeType: policy.mimeType, sizeBytes: bytes.length, width, height, altText: "", caption: "", description: "", uploadedAt: now.toISOString(), authorName: session.user.name || "" };
  } catch (error) {
    for (const relative of created) try { await fs.unlink(await checkedMediaPath(root, relative)); } catch { console.warn("Media upload cleanup incomplete"); }
    throw error;
  }
}
