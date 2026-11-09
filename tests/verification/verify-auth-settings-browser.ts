import assert from "node:assert/strict"
import { chromium } from "@playwright/test"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

const base = new URL(
  process.env.AUTH_SETTINGS_VERIFY_URL || "http://localhost:3000"
)
assert(
  ["localhost", "127.0.0.1", "::1"].includes(base.hostname),
  "Local verification only"
)
const browser = await chromium.launch({
  channel: process.platform === "win32" ? "msedge" : undefined,
  headless: true,
})
try {
  // Follow an actual public language route before opening an unqualified login URL.
  const visitor = await browser.newContext({ baseURL: base.origin })
  await visitor.addCookies([
    { name: "admin_lang", value: "ar", url: base.origin },
  ])
  assert.equal(
    (await visitor.request.get("/en", { timeout: 180000 })).status(),
    200
  )
  const loginPage = await visitor.newPage()
  await loginPage.goto("/cms-login", {
    waitUntil: "domcontentloaded",
    timeout: 180000,
  })
  assert.equal(await loginPage.locator("main").getAttribute("lang"), "en")
  await visitor.close()
  for (const [locale, dict, direction] of [
    ["en", en, "ltr"],
    ["ar", ar, "rtl"],
  ] as const) {
    const context = await browser.newContext({ baseURL: base.origin })
    await context.addCookies([
      { name: "site_lang", value: locale, url: base.origin },
      {
        name: "admin_lang",
        value: locale === "en" ? "ar" : "en",
        url: base.origin,
      },
    ])
    const page = await context.newPage()
    page.setDefaultTimeout(90000)
    for (const path of ["/cms-login", "/cms-admin"]) {
      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
        timeout: 180000,
      })
      assert.equal(response?.status(), 200)
      assert.equal(await page.locator("main").getAttribute("lang"), locale)
      assert.equal(await page.locator("html").getAttribute("lang"), locale)
      assert.equal(await page.locator("main").getAttribute("dir"), direction)
      await page
        .getByRole("heading", { name: dict["auth.login.title"], exact: true })
        .waitFor()
      const recovery = page.getByRole("link", {
        name: dict["auth.forgot.title"],
        exact: true,
      })
      assert.equal(
        new URL((await recovery.getAttribute("href"))!, base).searchParams.get(
          "lang"
        ),
        locale
      )
      await recovery.click()
      await page
        .getByRole("heading", { name: dict["auth.forgot.title"], exact: true })
        .waitFor()
      assert.equal(await page.locator("html").getAttribute("lang"), locale)
      const other = locale === "en" ? "ar" : "en"
      await page.locator(`nav[aria-label] a[lang="${other}"]`).click()
      await page.waitForURL((url) => url.searchParams.get("lang") === other)
      assert.equal(await page.locator("main").getAttribute("lang"), other)
      // Reset only this isolated browser's preference for the next login route.
      await context.addCookies([
        { name: "site_lang", value: locale, url: base.origin },
      ])
    }
    await context.close()
    console.log(
      `Login/recovery UI verified: ${locale}, ${direction}; independent admin preference and language switch.`
    )
  }
} finally {
  await browser.close()
}
