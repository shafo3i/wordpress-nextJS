import "dotenv/config"
import assert from "node:assert/strict"
import { readFile, writeFile } from "node:fs/promises"
import { Client } from "pg"
import { chromium } from "@playwright/test"
import { getPostViewCounts } from "../services/post-views.service"
import { pool } from "../db"
import en from "../templates/language/en.json"

async function main() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  if (new URL(base).hostname !== "localhost")
    throw new Error("Local browser verification only")
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  const month = (
    await client.query(
      `SELECT to_char(post_date,'YYYY-MM') AS month FROM wp_posts WHERE post_type='post' AND post_status='publish' GROUP BY 1 ORDER BY count(*) DESC LIMIT 1`
    )
  ).rows[0].month
  const sample = (
    await client.query(
      `SELECT p."ID"::text AS id,p.post_name FROM wp_posts p JOIN cms_post_translations l ON l.post_id=p."ID" WHERE p.post_type='post' AND p.post_status='publish' AND l.language_code='ar' ORDER BY p.post_date DESC LIMIT 1`
    )
  ).rows[0]
  await client.end()
  const before = (await getPostViewCounts([sample.id])).get(sample.id) || 0
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const context = await browser.newContext({
    baseURL: base,
    viewport: { width: 1440, height: 1000 },
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.setDefaultNavigationTimeout(180000)
  try {
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes(`/api/posts/${sample.id}/view`),
      { timeout: 90000 }
    ).catch(() => null)
    assert.equal(
      (
        await page.goto(`/ar/posts/${encodeURIComponent(sample.post_name)}`, {
          waitUntil: "domcontentloaded",
        })
      )?.status(),
      200
    )
    const track = await responsePromise
    assert(track, "Public view endpoint should respond")
    assert.equal(track.status(), 200)
    assert.equal(
      (await track.json()).counted,
      false,
      "Automated browser checks must not inflate counts"
    )
    assert.equal(
      await page.locator("[data-post-views]").getAttribute("data-view-count"),
      String(before)
    )
    const credentials = JSON.parse(
      await readFile(
        ".local/wordpress-migration/admin-credentials.json",
        "utf8"
      )
    )
    assert.equal(
      (
        await context.request.post("/api/auth/sign-in/email", {
          headers: { Origin: base },
          data: credentials,
        })
      ).status(),
      200
    )
    await page.goto(
      `/admincp/posts?date=${month}&lang=ar&status=publish&sort=views&order=desc`,
      { waitUntil: "domcontentloaded" }
    )
    const select = page.getByRole("combobox", {
      name: en["admin.common.filter_by_date"],
      exact: true,
    })
    assert(
      (await select
        .locator(
          'option[value="2019-01"],option[value="2020-01"],option[value="2026-10"]'
        )
        .count()) > 0
    )
    const values = (
      await page.locator("[data-admin-post-views]").allTextContents()
    ).map((value) => Number(value.replace(/[^0-9]/g, "")))
    assert(values.length > 0)
    assert(
      values.every((value, i) => i === 0 || values[i - 1] >= value),
      "Views sort should be numeric"
    )
    await select.selectOption("range")
    await page
      .getByLabel(en["admin.posts.date_from"], { exact: true })
      .fill(`${month}-01`)
    await page
      .getByLabel(en["admin.posts.date_to"], { exact: true })
      .fill(`${month}-28`)
    await page
      .getByRole("button", { name: en["admin.common.filter"], exact: true })
      .click()
    await page.waitForURL((url) => url.searchParams.get("date") === "range")
    for (const [key, value] of Object.entries({
      from: `${month}-01`,
      to: `${month}-28`,
      lang: "ar",
      status: "publish",
      sort: "views",
    }))
      assert.equal(new URL(page.url()).searchParams.get(key), value)
    const statusLink = page
      .getByRole("link", { name: new RegExp(en["admin.common.draft"]) })
      .first()
    assert.equal(
      new URL(
        (await statusLink.getAttribute("href")) || "",
        base
      ).searchParams.get("from"),
      `${month}-01`
    )
    await page.goto("/admincp/posts?date=range&from=2026-11-02&to=2026-11-01", {
      waitUntil: "domcontentloaded",
    })
    assert((await page.getByRole("alert").count()) > 0)
    assert(
      await page
        .getByRole("button", { name: en["admin.common.filter"], exact: true })
        .isDisabled()
    )
    await page.goto("/admincp/customize", { waitUntil: "domcontentloaded" })
    await page
      .getByRole("button", {
        name: en["admin.customizer.section.single"],
        exact: true,
      })
      .click()
    await page
      .locator("select")
      .filter({ has: page.locator('option[value="ar"]') })
      .selectOption("ar")
    const frame = page.frameLocator('iframe[title="Theme preview"]')
    await frame.locator("[data-post-views]").waitFor({ timeout: 90000 })
    const toggle = page.getByRole("checkbox", {
      name: en["admin.customizer.setting.singleShowViews"],
      exact: true,
    })
    await toggle.uncheck()
    await frame.locator("[data-post-views]").waitFor({ state: "detached" })
    await toggle.check()
    await frame.locator("[data-post-views]").waitFor()
    assert.equal(
      (await getPostViewCounts([sample.id])).get(sample.id) || 0,
      before,
      "Browser/admin/preview verification must leave real totals intact"
    )
    await context.request.post("/api/auth/sign-out", {
      headers: { Origin: base },
      data: {},
    })
    assert.deepEqual(errors, [])
    await writeFile(
      ".local/wordpress-migration/post-filters-views-verification.json",
      JSON.stringify(
        {
          actualMonthOptions: true,
          customRangeAndFilterPreservation: true,
          numericViewSorting: true,
          invalidRangesBlocked: true,
          publicViewCount: true,
          previewToggle: true,
          realTotalsUnchanged: true,
        },
        null,
        2
      )
    )
    console.log(
      "Post filters and view count browser checks passed; real article totals unchanged"
    )
  } catch (error) {
    await page.screenshot({ path: ".local/wordpress-migration/post-views-failure.png" })
    for (const child of page.frames().slice(1)) {
      console.log("Preview diagnostic", child.url(), (await child.locator("body").innerText()).slice(0, 1200))
    }
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Browser verification failed"
    )
    process.exitCode = 1
  })
  .finally(() => pool.end())
