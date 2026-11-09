import assert from "node:assert/strict"
import { chromium } from "@playwright/test"

const browser = await chromium.launch({ channel: "msedge", headless: true })
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  })
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const [path, locale, direction] of [
    ["/", "ar", "rtl"],
    ["/en", "en", "ltr"],
  ]) {
    const response = await page.goto(`http://localhost:3000${path}?home-check=1`, {
      waitUntil: "domcontentloaded",
      timeout: 180000,
    })
    assert.equal(response?.status(), 200)
    await page
      .locator(`[lang="${locale}"][dir="${direction}"]:visible`)
      .first()
      .waitFor({ timeout: 90000 })
    await page
      .locator("main h1:visible, main h2:visible, main h3:visible")
      .first()
      .waitFor({ timeout: 90000 })
    const headings = await page
      .locator("main h1, main h2, main h3")
      .allTextContents()
    assert(headings.length)
    const home = page.locator("[data-site-navigation]:visible a").first()
    assert.equal(await home.getAttribute("href"), path)
    await home.click()
    await page.waitForURL(url => url.pathname === path && !url.search)
    assert(
      locale === "ar"
        ? headings.some((title) => /\p{Script=Arabic}/u.test(title))
        : headings.some((title) => /[a-z]{3}/i.test(title))
    )
    await page.screenshot({
      path: `.local/wordpress-migration/homepage-language-${locale}.png`,
    })
    console.log("Browser homepage passed", {
      path,
      locale,
      direction,
      headings: headings.length,
    })
  }
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
}
