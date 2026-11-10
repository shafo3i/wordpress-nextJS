import { db, type DB } from "@/db"
import { languagesTable, translationsTable } from "@/db/schema/cms-languages"
import { getTemplateTranslations } from "./language.service"

/** Additive only: existing database wording remains authoritative. */
export async function syncMissingTranslations(database: DB = db) {
  const languages = await database
    .select({ code: languagesTable.code })
    .from(languagesTable)
  let added = 0,
    preserved = 0,
    missing = 0
  const base = getTemplateTranslations("en")
  await database.transaction(async (tx) => {
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
