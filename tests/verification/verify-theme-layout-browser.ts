import "dotenv/config"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { chromium } from "@playwright/test"
import { pool } from "@/db"
import { getActiveThemeSlug } from "@/lib/themes/loader"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

const browser = await chromium.launch({ channel: "msedge", headless: true })
try {
  const slug = await getActiveThemeSlug()
  const key = `homepage_settings_${slug}`
  const before = await pool.query("SELECT option_value FROM wp_options WHERE option_name=$1", [key])
  const credentials = JSON.parse(await readFile(".local/wordpress-migration/admin-credentials.json", "utf8"))
  const context = await browser.newContext({ baseURL: "http://localhost:3000", viewport: { width: 1440, height: 1100 } })
  const signedIn = await context.request.post("/api/auth/sign-in/email", { headers: { Origin: "http://localhost:3000" }, data: { email: credentials.email, password: credentials.password } })
  assert.equal(signedIn.status(), 200, "Local test login failed")
  assert(!(await signedIn.json()).twoFactorRedirect, "Local test account requires its MFA challenge; do not bypass it")
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  let mutations = 0
  await page.route("**/admincp/theme-settings**", async route => {
    if (route.request().method() === "POST") { mutations++; await route.abort(); return }
    await route.continue()
  })
  for (const [locale, dict] of [["en", en], ["ar", ar]] as const) {
    await context.addCookies([{ name: "admin_lang", value: locale, url: "http://localhost:3000" }])
    assert.equal((await page.goto("/admincp/theme-settings", { waitUntil: "networkidle", timeout: 180000 }))?.status(), 200)
    await page.getByRole("heading", { name: dict["admin.theme_layout.title"], exact: true }).waitFor()
    const form = page.locator("form").filter({ has: page.getByRole("heading", { name: dict["admin.theme_layout.title"], exact: true }) })
    assert.equal(await form.getAttribute("dir"), locale === "ar" ? "rtl" : "ltr")
    assert.equal(await form.getByRole("radio").count(), 4)
    assert.equal(await form.locator('[draggable="true"]').count(), 0)
    assert.equal(await form.getByText(dict["admin.theme_layout.scope_page"], { exact: true }).count(), 1)
    assert(!(await form.innerText()).includes("??"))
    assert.equal(await form.locator('a[href^="/admincp/studio/"]').count(), 2)
    assert.equal(await form.locator('a[href^="/admincp/customize?theme="]').count(), 1)
    const width = form.getByLabel(dict["admin.theme_layout.sidebar_width"], { exact: false })
    const gap = form.getByLabel(dict["admin.theme_layout.column_gap"], { exact: false })
    await width.fill("380")
    await gap.fill("0")
    await form.getByRole("radio").last().check()
    await form.getByRole("checkbox", { name: dict["admin.theme_layout.sticky"] }).uncheck()
    await form.getByRole("button", { name: dict["admin.theme_layout.reset"], exact: true }).click()
    assert.equal(await width.inputValue(), "")
    assert.equal(await gap.inputValue(), "")
    assert(await form.getByRole("checkbox", { name: dict["admin.theme_layout.sticky"] }).isChecked())
    await page.screenshot({ path: `.local/wordpress-migration/theme-layout-${locale}.png` })
    if (locale === "en") {
      const select = form.getByRole("combobox")
      const other = await select.locator("option").evaluateAll(nodes => nodes.map(node => (node as HTMLOptionElement).value).find(value => value !== (nodes[0].parentElement as HTMLSelectElement).value))
      assert(other)
      await select.selectOption(other)
      await page.waitForURL(url => url.searchParams.get("theme") === other)
      await page.getByRole("heading", { name: dict["admin.theme_layout.title"], exact: true }).waitFor()
      assert.equal(await page.locator('a[href^="/admincp/customize?theme="]').getAttribute("href"), `/admincp/customize?theme=${other}`)
    }
  }
  assert.equal(mutations, 0)
  assert.deepEqual((await pool.query("SELECT option_value FROM wp_options WHERE option_name=$1", [key])).rows, before.rows)
  assert.deepEqual(errors, [])
  await context.request.post("/api/auth/sign-out", { headers: { Origin: "http://localhost:3000" }, data: {} })
  await context.close()
  console.log("Theme Layout browser checks passed in English and Arabic: controls, theme switch, Studio/Customizer links and local reset. Live settings unchanged.")
} finally {
  await browser.close()
  await pool.end()
}
