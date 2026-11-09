import "dotenv/config"
import assert from "node:assert/strict"
import { readFile, writeFile } from "node:fs/promises"
import { Client } from "pg"
import { chromium } from "@playwright/test"
import en from "@/templates/language/en.json"

async function main() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  if (new URL(base).hostname !== "localhost")
    throw new Error("Local verification only")
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const category = (
    await client.query(
      `SELECT t.slug FROM wp_terms t JOIN wp_term_taxonomy x ON x.term_id=t.term_id JOIN cms_term_translations l ON l.term_taxonomy_id=x.term_taxonomy_id WHERE x.taxonomy='category' AND l.language_code='ar' ORDER BY x.count DESC LIMIT 1`
    )
  ).rows[0]
  await client.end()
  assert(category)
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const context = await browser.newContext({
    baseURL: base,
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.setDefaultNavigationTimeout(180000)
  try {
    const url = `/ar/category/${encodeURIComponent(category.slug)}`
    assert.equal(
      (await page.goto(url, { waitUntil: "domcontentloaded" }))?.status(),
      200
    )
    await page.locator("main article").first().waitFor()
    const text = await page.locator("main").innerText()
    assert(
      !/&(?:nbsp|lt|gt);/.test(text),
      "Archive excerpts should contain decoded text"
    )
    assert.equal(await page.locator("main article").count(), 12)
    assert.equal(await page.locator('main [aria-current="page"]').count(), 1)
    assert((await page.locator("main nav").last().locator("a").count()) <= 9)
    const image = await page.locator("main article img").first().boundingBox()
    assert(image && image.height <= 240, "List images should stay compact")
    await page.screenshot({
      path: ".local/wordpress-migration/category-desktop.png",
    })
    await page.setViewportSize({ width: 375, height: 812 })
    assert(
      await page
        .locator("main")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      "Mobile archive must not overflow"
    )
    await page.screenshot({
      path: ".local/wordpress-migration/category-mobile.png",
    })
    await page.setViewportSize({ width: 1440, height: 950 })
    const credentials = JSON.parse(
      await readFile(
        ".local/wordpress-migration/admin-credentials.json",
        "utf8"
      )
    )
    const login = await context.request.post("/api/auth/sign-in/email", {
      data: credentials,
      headers: { Origin: base },
      timeout: 60000,
    })
    assert.equal(login.status(), 200)
    await page.goto("/admincp/customize", { waitUntil: "domcontentloaded" })
    await page
      .getByRole("button", {
        name: en["admin.customizer.section.archive"],
        exact: true,
      })
      .click()
    await page
      .getByRole("combobox", {
        name: en["admin.customizer.setting.archiveLayout"],
        exact: true,
      })
      .waitFor()
    await page
      .locator("select")
      .filter({ has: page.locator('option[value="ar"]') })
      .selectOption("ar")
    const frame = page.frameLocator('iframe[title="Theme preview"]')
    await frame.locator("main article").first().waitFor({ timeout: 90000 })
    const layout = page.getByRole("combobox", {
      name: en["admin.customizer.setting.archiveLayout"],
      exact: true,
    })
    await layout.selectOption("grid")
    await page.waitForTimeout(500)
    const sizes = await frame
      .locator("main article")
      .evaluateAll((nodes) =>
        nodes.slice(0, 3).map((node) => node.getBoundingClientRect().width)
      )
    assert(
      sizes.every((width) => width < 600),
      "Grid preview should apply without saving"
    )
    assert.equal(
      await frame
        .locator("main article")
        .first()
        .evaluate((el) => getComputedStyle(el).borderRadius),
      "0px"
    )
    const radius = page.getByRole("slider", {
      name: en["admin.customizer.setting.archiveRadius"],
      exact: true,
    })
    await radius.fill("16")
    await page.waitForTimeout(300)
    assert.equal(
      await frame
        .locator("main article")
        .first()
        .evaluate((el) => getComputedStyle(el).borderRadius),
      "16px"
    )
    await radius.fill("0")
    await layout.selectOption("list")
    await page.waitForTimeout(300)
    assert.equal(
      await frame
        .locator("main article")
        .first()
        .evaluate((el) => getComputedStyle(el).borderRadius),
      "0px"
    )
    assert.deepEqual(errors, [])
    await context.request.post("/api/auth/sign-out", {
      headers: { Origin: base },
      data: {},
    })
    await writeFile(
      ".local/wordpress-migration/archive-verification.json",
      JSON.stringify(
        {
          publicArabicArchive: true,
          compactImages: true,
          decodedExcerpts: true,
          mobileNoOverflow: true,
          boundedPagination: true,
          customizerLiveGridAndRadius: true,
          publishedChanges: false,
        },
        null,
        2
      )
    )
    console.log("Archive and unsaved customizer preview browser checks passed")
  } finally {
    await context.close()
    await browser.close()
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Archive verification failed"
  )
  process.exitCode = 1
})
