import "dotenv/config"
import assert from "node:assert/strict"
import { pool } from "@/db"
import { getOptions } from "@/services/settings.service"
import { getDefaultLanguage } from "@/services/language.service"
import { getPublishedPageById } from "@/lib/site-content"
import { resolveStudioPageContent } from "@/services/studio-content.service"

try {
  const options = await getOptions(["page_on_front"])
  const defaultLanguage = await getDefaultLanguage()
  assert(defaultLanguage)
  const locales = [undefined, "ar", "en"]
  for (const requested of locales) {
    const expected: string = requested || defaultLanguage.code
    const page = await getPublishedPageById(options.page_on_front, requested)
    assert(page, `Missing homepage translation: ${expected}`)
    assert.equal(page.locale, expected)
    const resolved = await resolveStudioPageContent(page, expected)
    for (const result of Object.values(
      resolved.studioContent?.requests || {}
    )) {
      assert.equal(result.locale, expected)
      for (const item of result.items) assert.equal(item.locale, expected)
    }
    console.log("Homepage language passed", {
      requested: requested || "default",
      locale: page.locale,
      pageId: page.id,
    })
  }
} finally {
  await pool.end()
}
