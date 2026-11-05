import "dotenv/config"
import { test, expect } from "@playwright/test"
import { Client } from "pg"
import { randomBytes, randomUUID } from "node:crypto"
import { hashPassword } from "better-auth/crypto"
import type { StudioDocumentData } from "../lib/studio/types"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"

declare global {
  interface Window {
    HeaderFixture: typeof import("./fixtures/header.fixture")
  }
}

const baseURL = process.env.STUDIO_BASE_URL
test.describe("live bilingual Studio", () => {
  test.skip(
    !baseURL,
    "Set STUDIO_BASE_URL to the local running app; requires the bilingual seed."
  )
  test.setTimeout(60000)
  let client: Client
  const id = `studio-e2e-${randomUUID()}`
  const email = `${id}@example.test`
  const password = `${randomBytes(30).toString("base64url")}A9!`
  let homeEn: string,
    businessEnWidget: string,
    businessArWidget: string,
    technologyEnWidget: string,
    technologyId: string
  test.beforeAll(async () => {
    if (
      !baseURL ||
      !["localhost", "127.0.0.1", "::1"].includes(new URL(baseURL).hostname)
    )
      throw new Error("Live Studio tests require a local application URL.")
    client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()
    const marker = await client.query(
      "select option_value from wp_options where option_name='studio_seed_version'"
    )
    if (marker.rows[0]?.option_value !== "bilingual-1")
      throw new Error("Bilingual seed is required before live Studio tests.")
    const rows = await client.query(
      "select p.\"ID\"::text as id,p.post_name,m.meta_value from wp_posts p join wp_postmeta m on m.post_id=p.\"ID\" where p.post_name in ('home-en','home-ar') and m.meta_key='_studio_data'"
    )
    for (const row of rows.rows) {
      const doc = JSON.parse(row.meta_value) as StudioDocumentData
      const widget = doc.elements
        .flatMap((element) =>
          element.elements.flatMap((column) => column.elements)
        )
        .find(
          (element) => element.settings.blockConfig?.categorySlug === "business"
        )!
      if (row.post_name === "home-en") {
        homeEn = row.id
        businessEnWidget = widget.id
        technologyEnWidget = doc.elements
          .flatMap((element) =>
            element.elements.flatMap((column) => column.elements)
          )
          .find(
            (element) =>
              element.settings.blockConfig?.categorySlug === "technology"
          )!.id
      } else businessArWidget = widget.id
    }
    technologyId = (
      await client.query(
        "select tt.term_taxonomy_id::text as id from wp_term_taxonomy tt join wp_terms t on t.term_id=tt.term_id where t.slug='technology' and tt.taxonomy='category'"
      )
    ).rows[0].id
    // A unique, short-lived editor signs in through the real password endpoint.
    await client.query(
      'INSERT INTO "user"(id,name,email,email_verified,role) VALUES($1,$2,$3,true,$4)',
      [id, "Studio test editor", email, "editor"]
    )
    await client.query(
      "INSERT INTO account(id,account_id,provider_id,user_id,password,updated_at) VALUES($1,$2,$3,$4,$5,now())",
      [randomUUID(), id, "credential", id, await hashPassword(password)]
    )
  })
  test.afterAll(async () => {
    if (client) {
      await client.query('DELETE FROM "user" WHERE id=$1 AND email=$2', [
        id,
        email,
      ])
      await client.end()
    }
  })

  test("switches category and article language without switching the admin interface", async ({
    page,
  }) => {
    const response = await page.request.post(
      `${baseURL}/api/auth/sign-in/email`,
      { data: { email, password }, headers: { Origin: baseURL! } }
    )
    expect(response.status()).toBe(200)
    await page.goto(`${baseURL}/admincp/studio/${homeEn}`)
    const widget = page.locator(`[data-studio-element="${businessEnWidget}"]`)
    await expect(
      widget.getByRole("heading", { name: "Business", exact: true })
    ).toBeVisible({ timeout: 20000 })
    await widget.getByRole("heading", { name: "Business", exact: true }).click()
    await page
      .locator(`#studio-category-${businessEnWidget}`)
      .selectOption(technologyId)
    await expect
      .poll(() => widget.locator('a[href^="/posts/technology-"]').count(), {
        timeout: 15000,
      })
      .toBeGreaterThan(0)
    await expect(widget.locator('a[href^="/posts/business-"]')).toHaveCount(0)
    await page
      .locator(`#studio-language-${businessEnWidget}`)
      .selectOption("ar")
    await expect
      .poll(() => widget.locator('a[href^="/ar/posts/technology-"]').count(), {
        timeout: 15000,
      })
      .toBeGreaterThan(0)
    await expect(
      page.getByLabel("Article language", { exact: true })
    ).toBeVisible()
    await expect(widget.locator('[lang="ar"]')).toHaveAttribute("dir", "rtl")
    await page.locator(`#studio-language-${businessEnWidget}`).selectOption("")
    page.on("dialog", (dialog) => dialog.accept())
    await page.locator(`a[href="/admincp/studio/${homeEn}?lang=ar"]`).click()
    await expect(
      widget.locator('a[href^="/ar/posts/business-"]')
    ).not.toHaveCount(0, { timeout: 20000 })
    await widget.getByRole("heading", { name: "الأعمال", exact: true }).click()
    await expect(
      page.getByLabel("Article language", { exact: true })
    ).toBeVisible()
  })

  test("adds the headline cover slider and independent ticker with bilingual feeds", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    const login = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
      data: { email, password },
      headers: { Origin: baseURL! },
    })
    expect(login.status()).toBe(200)
    await page.goto(`${baseURL}/admincp/studio/${homeEn}`)
    await page
      .getByRole("button", { name: "Headline Cover Slider", exact: true })
      .click()
    const slider = page.getByRole("region", {
      name: "Top stories",
      exact: true,
    })
    await expect(slider.getByRole("heading")).toBeVisible({ timeout: 20000 })
    const firstTitle = (await slider.getByRole("heading").textContent())!
    await slider
      .getByRole("button", { name: "Next story", exact: true })
      .click()
    await expect(slider.getByRole("heading")).not.toHaveText(firstTitle)
    await expect(slider.locator('img[data-active="true"]')).toHaveCSS(
      "transition-duration",
      "0.7s"
    )
    expect(
      await slider.locator('img[data-active="false"]').count()
    ).toBeGreaterThan(0)
    const queue = slider.getByRole("group", { name: "Choose a story" })
    await queue.getByRole("button").first().click()
    await expect(slider.getByRole("heading")).toHaveText(firstTitle)
    await page
      .getByLabel("Automatically rotate stories", { exact: true })
      .uncheck()
    await expect(
      slider.getByRole("button", { name: "Pause stories" })
    ).toHaveCount(0)
    await page
      .getByLabel("Article language", { exact: true })
      .selectOption("ar")
    await expect(slider.locator('a[href^="/ar/posts/"]')).not.toHaveCount(0)
    await expect(slider).toHaveAttribute("dir", "rtl")
    await slider.screenshot({ path: "test-results/headline-slider-ar.png" })
    await page
      .getByRole("banner")
      .getByTitle("Elements", { exact: true })
      .click()
    await page
      .getByRole("button", { name: "Breaking News Ticker Bar", exact: true })
      .click()
    const ticker = page
      .getByRole("region", { name: "Breaking", exact: true })
      .last()
    await expect(ticker.locator('a[href^="/posts/"]')).not.toHaveCount(0)
    const movement = async () =>
      ticker.locator("[data-direction]").evaluate((element) => {
        const animation = element.getAnimations()[0]
        if (!animation) throw new Error("Ticker animation is missing")
        animation.pause()
        const duration = Number(animation.effect!.getTiming().duration)
        const viewport = element.parentElement!.getBoundingClientRect()
        for (const progress of [0, 0.1, 0.5, 0.9, 0.999]) {
          animation.currentTime = duration * progress
          const visible = Array.from(element.querySelectorAll("a")).some(
            (link) => {
              const rect = link.getBoundingClientRect()
              return rect.right > viewport.left && rect.left < viewport.right
            }
          )
          if (!visible)
            throw new Error(`Blank ticker at ${progress} of its loop`)
        }
        animation.currentTime = 1000
        const first = new DOMMatrixReadOnly(getComputedStyle(element).transform)
          .m41
        animation.currentTime = 2000
        const second = new DOMMatrixReadOnly(
          getComputedStyle(element).transform
        ).m41
        return second - first
      })
    expect(await movement()).toBeLessThan(0)
    const tickerFirst = await ticker.locator("a").first().innerText()
    await ticker
      .getByRole("button", { name: "Next story", exact: true })
      .click()
    await expect(ticker.locator("a").first()).not.toHaveText(tickerFirst)
    await page
      .getByLabel("Article language", { exact: true })
      .selectOption("ar")
    await expect(ticker.locator('a[href^="/ar/posts/"]')).not.toHaveCount(0)
    await expect(ticker.locator("[data-direction]")).toHaveAttribute(
      "data-direction",
      "rtl"
    )
    expect(await movement()).toBeGreaterThan(0)
    await ticker.hover()
    await expect(ticker.locator("[data-direction]")).toHaveAttribute(
      "data-paused",
      "false"
    )
    await page.getByRole("button", { name: "Style", exact: true }).click()
    await page.getByLabel("Background Color", { exact: true }).fill("#102030")
    await page
      .getByLabel("Text / Accent Color", { exact: true })
      .fill("#ffffff")
    await page
      .getByLabel("Ticker label colour", { exact: true })
      .fill("#ff0000")
    await page.getByLabel("Font Size", { exact: true }).press("Home")
    for (let step = 0; step < 6; step++)
      await page.getByLabel("Font Size", { exact: true }).press("ArrowRight")
    await expect(ticker).toHaveCSS("background-color", "rgb(16, 32, 48)")
    await expect(ticker.locator("a").first()).toHaveCSS("font-size", "18px")
    await expect(ticker.locator("a").first()).toHaveCSS(
      "color",
      "rgb(255, 255, 255)"
    )
    await page.getByRole("button", { name: "Advanced", exact: true }).click()
    await page.getByLabel("Padding Top", { exact: true }).fill("0")
    await page.getByLabel("Padding Left", { exact: true }).fill("32")
    await expect(ticker).toHaveCSS("padding-top", "0px")
    await expect(ticker).toHaveCSS("padding-left", "32px")
    const tickerWidget = ticker.locator(
      "xpath=ancestor::*[@data-studio-element][1]"
    )
    const refreshResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/studio/content") &&
        response.status() === 200
    )
    await tickerWidget
      .getByRole("button", { name: "Refresh articles", exact: true })
      .click()
    await refreshResponse
    await expect(
      tickerWidget.getByRole("button", {
        name: "Refresh articles",
        exact: true,
      })
    ).toBeEnabled()
    expect(
      Math.abs(
        (await tickerWidget.boundingBox())!.height -
          (await ticker.boundingBox())!.height
      )
    ).toBeLessThan(1)
    await ticker.screenshot({ path: "test-results/ticker-ar.png" })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect(ticker.locator("[data-direction]")).toHaveCSS(
      "animation-name",
      "none"
    )
    await expect(slider.locator('img[data-active="true"]')).toHaveCSS(
      "transition-duration",
      "0s"
    )
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await page.getByTitle("Preview Canvas", { exact: true }).click()
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(slider.getByRole("heading")).toBeVisible()
    expect((await slider.boundingBox())!.width).toBeLessThanOrEqual(390)
    await slider.screenshot({ path: "test-results/headline-slider-mobile.png" })
  })

  test("scrolls the masthead away and keeps only navigation visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${baseURL}/`)
    const nav = page.locator("[data-site-navigation]")
    await expect(nav).toBeVisible()
    const initial = (await nav.boundingBox())!.y
    expect(initial).toBeGreaterThan(0)
    await expect(page.locator("main").first()).toHaveCSS("padding-top", "0px")
    await page.evaluate(() => window.scrollTo(0, 700))
    await expect
      .poll(async () => Math.abs((await nav.boundingBox())!.y))
      .toBeLessThan(2)
    expect((await page.locator("header").boundingBox())!.y).toBeLessThan(-50)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect
      .poll(async () => Math.abs((await nav.boundingBox())!.y))
      .toBeLessThan(2)
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect
      .poll(async () => (await nav.boundingBox())!.y)
      .toBeGreaterThan(0)
  })

  test("moves existing canvas blocks between sections and beside each other with undo", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    const login = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
      data: { email, password },
      headers: { Origin: baseURL! },
    })
    expect(login.status()).toBe(200)
    await page.goto(`${baseURL}/admincp/studio/${homeEn}`)
    await page.getByTitle("Structure", { exact: true }).click()
    const source = page.locator(`[data-studio-element="${businessEnWidget}"]`)
    const target = page.locator(`[data-studio-element="${technologyEnWidget}"]`)
    await expect(source).toBeVisible({ timeout: 20000 })
    const parentId = async (locator: typeof source) =>
      locator.evaluate((node) =>
        node
          .parentElement!.closest("[data-studio-element]")!
          .getAttribute("data-studio-element")
      )
    const originalParent = await parentId(source)
    const destination = await parentId(target)
    const drag = async (position: "before" | "left" | "inside") => {
      const transfer = await page.evaluateHandle(() => new DataTransfer())
      await source
        .locator(`[data-studio-drag-handle="${businessEnWidget}"]`)
        .dispatchEvent("dragstart", { dataTransfer: transfer })
      const dropTarget =
        position === "inside"
          ? page.locator(`[data-studio-element="${destination}"]`)
          : target
      await dropTarget.scrollIntoViewIfNeeded()
      const bounds = (await dropTarget.boundingBox())!
      const location = {
        dataTransfer: transfer,
        clientX: bounds.x + (position === "left" ? 2 : bounds.width / 2),
        clientY: bounds.y + (position === "before" ? 2 : bounds.height / 2),
      }
      await dropTarget.dispatchEvent("dragover", location)
      await expect(
        dropTarget.locator(`[data-studio-drop-position="${position}"]`)
      ).toHaveCount(1)
      await dropTarget.dispatchEvent("drop", location)
      await transfer.dispose()
    }
    await drag("before")
    expect(await parentId(source)).toBe(destination)
    await page.getByTitle("Undo", { exact: true }).click()
    expect(await parentId(source)).toBe(originalParent)
    await page.getByTitle("Redo", { exact: true }).click()
    expect(await parentId(source)).toBe(destination)
    await page.getByTitle("Undo", { exact: true }).click()
    await drag("left")
    const sourceBounds = (await source.boundingBox())!,
      targetBounds = (await target.boundingBox())!
    expect(Math.abs(sourceBounds.y - targetBounds.y)).toBeLessThan(2)
    expect(sourceBounds.x + sourceBounds.width).toBeLessThanOrEqual(
      targetBounds.x
    )
    await page.getByTitle("Undo", { exact: true }).click()
    await drag("inside")
    expect(await parentId(source)).toBe(destination)
    await expect(source).toHaveCount(1)
    // Keep both long feeds visible together to exercise a real mouse drag.
    await page.addStyleTag({
      content: `[data-studio-element="${businessEnWidget}"], [data-studio-element="${technologyEnWidget}"] { height: 120px !important; overflow: hidden; }`,
    })
    await expect(source).toHaveCSS("height", "120px")
    await source.hover()
    const bounds = (await target.boundingBox())!
    await source
      .locator(`[data-studio-drag-handle="${businessEnWidget}"]`)
      .dragTo(target, { targetPosition: { x: bounds.width / 2, y: 3 } })
    await page.screenshot({ path: "test-results/studio-mouse-drag.png" })
    expect(
      await source.evaluate(
        (node, targetId) =>
          Boolean(
            node.compareDocumentPosition(
              document.querySelector(`[data-studio-element="${targetId}"]`)!
            ) & Node.DOCUMENT_POSITION_FOLLOWING
          ),
        technologyEnWidget
      )
    ).toBe(true)
  })

  test("shows a session-only homepage admin toolbar without overlapping sticky navigation", async ({
    page,
  }) => {
    const login = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
      data: { email, password },
      headers: { Origin: baseURL! },
    })
    expect(login.status()).toBe(200)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${baseURL}/`)
    const bar = page.locator("[data-public-admin-bar]")
    await expect(bar).toBeVisible()
    await expect(
      bar.getByRole("link", { name: "Edit in Studio" })
    ).toHaveAttribute("href", `/admincp/studio/${homeEn}`)
    await page.evaluate(() => window.scrollTo(0, 700))
    const nav = page.locator("[data-site-navigation]")
    await expect.poll(async () => (await nav.boundingBox())!.y).toBe(32)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect.poll(async () => (await nav.boundingBox())!.y).toBe(46)
    await bar.getByRole("link", { name: "Dashboard", exact: true }).click()
    await expect(
      page.getByRole("link", { name: "Visit site", exact: true })
    ).toHaveAttribute("href", "/")
    await page.getByRole("link", { name: "Visit site", exact: true }).click()
    await expect(bar).toBeVisible()
    await page.goto(`${baseURL}/ar`)
    await expect(
      bar.getByRole("link", { name: "Edit in Studio" })
    ).not.toHaveAttribute("href", `/admincp/studio/${homeEn}`)
  })

  test("keeps both saved homepage tickers close to navigation and vertically centred", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1565, height: 1000 })
    for (const path of ["/", "/ar"]) {
      await page.goto(`${baseURL}${path}`)
      const ticker = page
        .locator("section")
        .filter({ has: page.locator("[data-direction]") })
        .first()
      await expect(ticker).toBeVisible()
      const header = (await page.locator("header").boundingBox())!
      const box = (await ticker.boundingBox())!
      expect(box.y - header.y - header.height).toBeGreaterThanOrEqual(0)
      expect(box.y - header.y - header.height).toBeLessThanOrEqual(16)
      const control = (await ticker.getByRole("button").first().boundingBox())!
      const link = (await ticker.locator("a").first().boundingBox())!
      expect(
        Math.abs(control.y + control.height / 2 - box.y - box.height / 2)
      ).toBeLessThanOrEqual(1)
      expect(
        Math.abs(link.y + link.height / 2 - box.y - box.height / 2)
      ).toBeLessThanOrEqual(1)
      await page.screenshot({
        path: `test-results/ticker-spacing-${path === "/" ? "en" : "ar"}.png`,
      })
    }
  })

  test("renders every theme header layout with active links and sticky mobile navigation", async ({
    page,
  }) => {
    const bundled = await build({
      entryPoints: [
        fileURLToPath(
          new URL("./fixtures/header.fixture.tsx", import.meta.url)
        ),
      ],
      bundle: true,
      write: false,
      outdir: "test-results/header-fixture",
      format: "iife",
      globalName: "HeaderFixture",
      platform: "browser",
      plugins: [
        {
          name: "next-fixture",
          setup(build) {
            build.onResolve(
              { filter: /^next\/(link|navigation)$/ },
              (args) => ({ path: args.path, namespace: "next-fixture" })
            )
            build.onLoad(
              { filter: /.*/, namespace: "next-fixture" },
              (args) => ({
                contents: args.path.endsWith("navigation")
                  ? 'export const usePathname = () => "/business-desk-en";'
                  : 'import React from "react"; export default function Link(props) { return React.createElement("a",props,props.children); }',
                loader: "js",
                resolveDir: process.cwd(),
              })
            )
          },
        },
      ],
    })
    await page.route("**/fonts.googleapis.com/**", (route) => route.abort())
    await page.goto(`${baseURL}/business-desk-en`)
    await expect(page.locator("[data-site-navigation]")).toBeVisible()
    const stylesheets = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLLinkElement).href)
      )
    const styles = await Promise.all(
      stylesheets
        .filter((url) => url.startsWith(baseURL!))
        .map(async (url) => (await page.request.get(url)).text())
    )
    await page.goto("about:blank")
    await page.setContent('<div id="header-fixture"></div>')
    for (const content of styles) await page.addStyleTag({ content })
    for (const file of bundled.outputFiles) {
      if (file.path.endsWith(".css"))
        await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    for (const slug of [
      "pressforge-broadsheet",
      "pressforge-magazine",
      "pressforge-midnight",
      "pressforge-longform",
    ]) {
      for (const layout of [
        "classic",
        "magazine",
        "minimal",
        "centered",
      ] as const) {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.evaluate(
          ({ slug, layout }) =>
            window.HeaderFixture.render(slug, layout, layout === "centered"),
          { slug, layout }
        )
        const header = page.locator("header")
        await expect(header).toHaveAttribute("data-layout", layout)
        const nav = page.locator("[data-site-navigation]")
        await expect(nav.locator('[aria-current="page"]')).toHaveAttribute(
          "href",
          "/business-desk-en"
        )
        expect((await nav.boundingBox())!.height).toBeGreaterThanOrEqual(56)
        if (layout === "classic")
          await header.screenshot({ path: `test-results/header-${slug}.png` })
        await page.setViewportSize({ width: 390, height: 844 })
        await page.evaluate(() => window.scrollTo(0, 600))
        await expect
          .poll(async () => Math.abs((await nav.boundingBox())!.y))
          .toBeLessThan(2)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(390)
        await page.evaluate(() => window.scrollTo(0, 0))
      }
      await page.evaluate(
        (slug) => window.HeaderFixture.render(slug, "minimal", false, false),
        slug
      )
      await expect(page.locator("header")).toHaveCSS("position", "static")
    }
  })

  test("server-renders the correct Arabic Business feed on the published homepage", async ({
    page,
  }) => {
    const response = await page.goto(`${baseURL}/ar`)
    expect(response?.status()).toBe(200)
    await expect(page.locator("[data-public-admin-bar]")).toHaveCount(0)
    const widget = page.locator(`[data-studio-element="${businessArWidget}"]`)
    await expect(widget).toBeVisible()
    await expect(
      widget.locator('a[href^="/ar/posts/business-"]')
    ).not.toHaveCount(0)
    await expect(widget.locator('a[href^="/posts/"]')).toHaveCount(0)
    const source = await (await page.request.get(`${baseURL}/ar`)).text()
    expect(source).toContain("/ar/posts/business-")
  })
})
