import "dotenv/config"
import assert from "node:assert/strict"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { Client } from "pg"
import { chromium } from "@playwright/test"

// Explicit live smoke check, kept separate from unit tests. No credentials are logged.
async function main() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
    throw new Error("This verifier is restricted to a local application")
  const out = resolve(".local/wordpress-migration")
  const credentials = JSON.parse(
    await readFile(resolve(out, "admin-credentials.json"), "utf8")
  )
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  })
  await client.connect()
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const context = await browser.newContext({ baseURL: base })
  const results: Record<string, unknown> = {}
  try {
    const sample = (
      await client.query(
        `SELECT p.post_name,p.post_title,a.guid FROM wp_posts p JOIN wp_postmeta m ON m.post_id=p."ID" AND m.meta_key='_thumbnail_id' JOIN wp_posts a ON a."ID"=m.meta_value::bigint WHERE p.post_type='post' AND p.post_status='publish' AND a.guid LIKE '/uploads/%' ORDER BY p.post_date DESC LIMIT 1`
      )
    ).rows[0]
    assert(
      sample,
      "A published article with a local featured image is required"
    )
    const page = await context.newPage()
    const browserErrors: string[] = []
    page.on("pageerror", (error) => browserErrors.push(error.message))
    page.setDefaultNavigationTimeout(180000)
    for (const path of ["/", "/ar"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" })
      assert.equal(response?.status(), 200, `Homepage ${path}`)
      await page.waitForTimeout(2000)
      assert(
        !(await page.locator("body").innerText()).includes(
          "This page couldn’t load"
        )
      )
      if (path === "/ar")
        assert(
          (await page.locator("body").innerText()).includes(sample.post_title),
          "Arabic widgets should show imported news"
        )
      results[path] = "rendered"
      await page.screenshot({
        path: resolve(
          out,
          path === "/ar" ? "homepage-ar.png" : "homepage-en.png"
        ),
        fullPage: false,
      })
    }
    const image = await context.request.get(sample.guid)
    assert.equal(image.status(), 200)
    assert.match(image.headers()["content-type"], /^image\//)
    const article = await page.goto(
      `/ar/posts/${encodeURIComponent(sample.post_name)}`,
      { waitUntil: "domcontentloaded" }
    )
    assert.equal(article?.status(), 200)
    assert((await page.locator("body").innerText()).includes(sample.post_title))
    results.articleAndFeaturedImage = "rendered"
    const signIn = await context.request.post("/api/auth/sign-in/email", {
      headers: { Origin: base },
      data: { email: credentials.email, password: credentials.password },
      timeout: 180000,
    })
    assert.equal(signIn.status(), 200, "Administrator sign-in")
    results.adminLogin = "passed"
    for (const path of [
      "/admincp/pages",
      "/admincp/posts",
      "/admincp/media",
      "/admincp/settings",
    ]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" })
      assert.equal(response?.status(), 200, path)
      assert(
        new URL(page.url()).pathname.startsWith("/admincp"),
        "Authenticated admin route"
      )
      assert(
        !(await page.locator("body").innerText()).includes(
          "This page couldn’t load"
        )
      )
      results[path] = "rendered"
    }
    const imported = JSON.parse(
      await readFile(resolve(out, "result.json"), "utf8")
    )
    const studioPath = `/admincp/studio/${imported.homepages.ar}`
    const studioResponse = await page.goto(studioPath, {
      waitUntil: "domcontentloaded",
    })
    assert.equal(studioResponse?.status(), 200, "Studio homepage editor")
    await page
      .locator("[data-studio-element]")
      .first()
      .waitFor({ timeout: 60000 })
    results.studioEditor = "rendered with imported widgets"
    assert.deepEqual(browserErrors, [], "No browser runtime errors")
    await context.request.post("/api/auth/sign-out", {
      headers: { Origin: base },
      data: {},
    })
    await writeFile(
      resolve(out, "verification.json"),
      JSON.stringify(results, null, 2)
    )
    console.log(JSON.stringify(results))
  } finally {
    await context.close()
    await browser.close()
    await client.end()
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Verification failed")
  process.exitCode = 1
})
