import { checkCmsRateLimit } from "@/lib/rate-limit";
import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import { eq, sql } from "drizzle-orm";
import { db, type DB } from "@/db"
import { languagesTable, translationsTable, createLanguageSchema, installLanguageTemplateSchema } from "@/db/schema/cms-languages"
import { getAvailableTemplateLocales, getTemplateTranslations } from "./language.service"

export function getInstallableLanguageTemplates() {
  return getAvailableTemplateLocales().flatMap(code => {
    const template = getTemplateTranslations(code)
    const parsed = createLanguageSchema.safeParse({ code, name: template["language.name"], nativeName: template["language.native_name"], direction: template["language.direction"] })
    if (!parsed.success || !template["language.native_name"] || !template["language.direction"]) return []
    const { name, nativeName, direction } = parsed.data
    return [{ code, name, nativeName, direction }]
  }).sort((a, b) => a.code.localeCompare(b.code))
}

/** Register bundled languages and import wording atomically; never replace overrides. */
export async function installLanguageTemplate(input: unknown, database: DB = db) {
  const actor = await verifyAdmin()
  await checkCmsRateLimit(actor.user.id, "sync")
  const selection = installLanguageTemplateSchema.parse(input)
  const template = getInstallableLanguageTemplates().find(item => item.code === selection.code)
  if (!template) throw new Error("Unavailable language template")
  const translations = Object.entries(getTemplateTranslations(template.code)).filter(([, value]) => !!value.trim())
  await database.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`)
    const existing = await tx.select({ code: languagesTable.code, isDefault: languagesTable.isDefault, isActive: languagesTable.isActive }).from(languagesTable)
    const isDefault = selection.isDefault || !existing.some(item => item.isDefault && item.isActive)
    if (isDefault && existing.length) await tx.update(languagesTable).set({ isDefault: false })
    await tx.insert(languagesTable).values({ ...template, isDefault, isActive: true }).onConflictDoNothing({ target: languagesTable.code })
    if (isDefault && existing.some(item => item.code === template.code)) {
      await tx.update(languagesTable).set({ isDefault: true, isActive: true }).where(eq(languagesTable.code, template.code))
    }
    for (let index = 0; index < translations.length; index += 200) {
      await tx.insert(translationsTable).values(translations.slice(index, index + 200).map(([key, value]) => ({ languageCode: template.code, key, value })))
        .onConflictDoNothing({ target: [translationsTable.languageCode, translationsTable.key] })
    }
  })
}

/** Additive only: existing database wording remains authoritative. */
export async function syncMissingTranslations(database: DB = db) {
  const rateActor = await verifyAdmin();
  await checkCmsRateLimit(rateActor.user.id, "sync");
  let languages: { code: string }[] = []
  let added = 0,
    preserved = 0,
    missing = 0
  const base = getTemplateTranslations("en")
  await database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:languages'))`);
    languages = await tx.select({ code: languagesTable.code }).from(languagesTable);
    for (const { code } of languages) {
      const template = getTemplateTranslations(code)
      const entries = Object.entries(template).filter(
        ([key, value]) =>
          key.length <= 255 && typeof value === "string" && !!value.trim()
      )
      missing += Object.keys(base).filter(
        (key) => !template[key]?.trim()
      ).length
      for (let index = 0; index < entries.length; index += 200) {
        const batch = entries
          .slice(index, index + 200)
          .map(([key, value]) => ({ languageCode: code, key, value }))
        const inserted = await tx
          .insert(translationsTable)
          .values(batch)
          .onConflictDoNothing({
            target: [translationsTable.languageCode, translationsTable.key],
          })
          .returning({ id: translationsTable.id })
        added += inserted.length
        preserved += batch.length - inserted.length
      }
    }
  })
  return { added, preserved, missing, languages: languages.length }
}
