import { checkCmsRateLimit } from "@/lib/rate-limit";
import "server-only"
import { and, eq, inArray, sql } from "drizzle-orm"
import { verifyAdmin } from "@/lib/authMIddleware"
import { db, type DB } from "@/db"
import { wpOptions, wpPostmeta, wpPosts } from "@/db/schema"
import {
  saveStudioPageSchema,
  studioPageIdSchema,
} from "@/db/schema/cms-studio"
import { sanitizeStudioDocument } from "@/lib/studio/sanitize"
import type { StudioSaveResult } from "@/lib/studio/types"

/** All Studio document mutations validate at the service boundary. */
export async function saveStudioPageData(
  raw: unknown,
  database: DB = db
): Promise<Extract<StudioSaveResult, { success: true }>> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "write");
  const input = saveStudioPageSchema.parse(raw)
  const pageId = BigInt(input.pageId)
  const now = new Date()
  const template = input.template || input.document.pageTemplate
  const document = sanitizeStudioDocument({
    ...input.document,
    pageTemplate: template,
    settings: input.document.settings
      ? { ...input.document.settings, pageTemplate: template }
      : undefined,
  })

  return database.transaction(async (tx) => {
    // Share the Pages lock so homepage/status changes cannot race its mutations.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:pages'))`
    )
    const [existing] = await tx
      .select({ status: wpPosts.postStatus })
      .from(wpPosts)
      .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")))
      .for("update")
    if (!existing || existing.status === "trash")
      throw new Error("Studio page does not exist.")
    const status = input.status ?? existing.status
    if (input.setAsFrontPage && status !== "publish") {
      throw new Error("Only published pages can be assigned as the homepage.")
    }
    if (status !== "publish") {
      const options = await tx
        .select({ name: wpOptions.optionName, value: wpOptions.optionValue })
        .from(wpOptions)
        .where(
          inArray(wpOptions.optionName, ["show_on_front", "page_on_front"])
        )
      const settings = new Map(
        options.map((option) => [option.name, option.value])
      )
      if (
        settings.get("show_on_front") === "page" &&
        settings.get("page_on_front") === input.pageId
      )
        throw new Error("The assigned homepage must remain published.")
    }
    await tx
      .update(wpPosts)
      .set({
        postModified: now,
        postModifiedGmt: now,
        ...(input.title !== undefined ? { postTitle: input.title } : {}),
        ...(input.status !== undefined ? { postStatus: input.status } : {}),
      })
      .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")))

    await tx
      .delete(wpPostmeta)
      .where(
        and(
          eq(wpPostmeta.postId, pageId),
          inArray(wpPostmeta.metaKey, [
            "_studio_edit_mode",
            "_studio_data",
            "_wp_page_template",
          ])
        )
      )
    await tx.insert(wpPostmeta).values([
      { postId: pageId, metaKey: "_studio_edit_mode", metaValue: "builder" },
      {
        postId: pageId,
        metaKey: "_studio_data",
        metaValue: JSON.stringify(document),
      },
      { postId: pageId, metaKey: "_wp_page_template", metaValue: template },
    ])

    if (input.setAsFrontPage) {
      await tx
        .insert(wpOptions)
        .values([
          { optionName: "show_on_front", optionValue: "page", autoload: "yes" },
          {
            optionName: "page_on_front",
            optionValue: input.pageId,
            autoload: "yes",
          },
        ])
        .onConflictDoUpdate({
          target: wpOptions.optionName,
          set: { optionValue: sql`excluded.option_value` },
        })
    }
    return { success: true as const, document, status }
  })
}

export async function setPageStudioMode(
  id: bigint | string | number,
  enabled: boolean,
  database: DB = db
): Promise<void> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "write");
  const pageId = BigInt(studioPageIdSchema.parse(String(id)))
  if (typeof enabled !== "boolean")
    throw new Error("Invalid Studio editor mode.")

  await database.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:pages'))`
    )
    const [existing] = await tx
      .select({ status: wpPosts.postStatus })
      .from(wpPosts)
      .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")))
      .for("update")
    if (!existing || existing.status === "trash")
      throw new Error("Studio page does not exist.")
    const [page] = await tx
      .update(wpPosts)
      .set({ postModified: new Date() })
      .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")))
      .returning({ id: wpPosts.id })
    if (!page) throw new Error("Studio page does not exist.")

    await tx
      .delete(wpPostmeta)
      .where(
        and(
          eq(wpPostmeta.postId, pageId),
          eq(wpPostmeta.metaKey, "_studio_edit_mode")
        )
      )
    if (enabled) {
      await tx.insert(wpPostmeta).values({
        postId: pageId,
        metaKey: "_studio_edit_mode",
        metaValue: "builder",
      })
    }
  })
}

export const studioDocumentService = {
  save: saveStudioPageData,
  setMode: setPageStudioMode,
}
