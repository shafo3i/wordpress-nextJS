import { test, expect, type Page } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"

declare global {
  interface Window {
    StudioDesignFixture: typeof import("./fixtures/studio-design.fixture")
  }
}
const renderWarnings = new WeakMap<Page, string[]>()

test("card outlines, inner dividers and section underlines are independently controlled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 1000 })
  await page.evaluate(() =>
    window.StudioDesignFixture.render("list", false, 1100, true, undefined, 5)
  )
  await page.getByText("Cards, images and list layout", { exact: true }).click()
  const card = page.locator("#preview article").first(),
    divider = card.locator("[data-studio-divider]").first(),
    heading = page.locator("#preview [data-studio-section-heading]").first()
  await page.getByLabel("Card outlines", { exact: true }).selectOption("true")
  await page
    .getByLabel("Post and column dividers", { exact: true })
    .selectOption("true")
  await page
    .getByLabel("Section title underline", { exact: true })
    .selectOption("true")
  await expect(card).toHaveCSS("border-top-width", "1px")
  await expect(divider).toHaveCSS("border-top-width", "1px")
  await expect(heading).toHaveCSS("border-bottom-width", "1px")
  await page.getByLabel("Card outlines", { exact: true }).selectOption("false")
  await expect(card).toHaveCSS("border-top-width", "0px")
  await expect(divider).toHaveCSS("border-top-width", "1px")
  await page
    .getByLabel("Post and column dividers", { exact: true })
    .selectOption("false")
  await expect(divider).toHaveCSS("border-top-width", "0px")
  await expect(heading).toHaveCSS("border-bottom-width", "1px")
  await page
    .getByLabel("Section title underline", { exact: true })
    .selectOption("false")
  await expect(heading).toHaveCSS("border-bottom-width", "0px")
  await page.evaluate(() => window.StudioDesignFixture.render("broadsheet", false, 1100, false, undefined, 9))
  const column=page.locator('#preview [data-studio-divider="column"]')
  await expect(column).toHaveCSS('border-inline-start-width','0px')
  await page.getByText("Cards, images and list layout",{exact:true}).click()
  await page.getByLabel("Post and column dividers",{exact:true}).selectOption("true")
  await expect(column).toHaveCSS('border-inline-start-width','1px')
  await page.getByLabel("Post and column dividers",{exact:true}).selectOption("false")
  await expect(column).toHaveCSS('border-inline-start-width','0px')
  await page.evaluate(() =>
    window.StudioDesignFixture.render("list", false, 1100, false, undefined, 5)
  )
  await expect(card).toHaveCSS("border-top-width", "0px")
  await expect(divider).toHaveCSS("border-top-width", "0px")
  await expect(heading).toHaveCSS("border-bottom-width", "0px")
})
test.beforeEach(async ({ page }) => {
  await page.route("https://fixture-images.test/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"/>',
    })
  )
  page.on("pageerror", (error) =>
    console.error("Fixture runtime:", error.message)
  )
  const warnings: string[] = []
  renderWarnings.set(page, warnings)
  page.on("console", (message) => {
    if (/unique.*key|hydration|hydrated/i.test(message.text()))
      warnings.push(message.text())
  })
  const bundle = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/studio-design.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    outdir: "test-results/studio-design-fixture",
    platform: "browser",
    format: "iife",
    globalName: "StudioDesignFixture",
    plugins: [
      {
        name: "next-link-fixture",
        setup(build) {
          build.onResolve({ filter: /^next\/(link|image)$/ }, (args) => ({
            path: args.path,
            namespace: "link",
          }))
          build.onLoad({ filter: /.*/, namespace: "link" }, (args) => ({
            contents: args.path.endsWith("image")
              ? 'import React from "react";export default p=>React.createElement("img",p)'
              : 'import React from "react"; export default function Link(props) { return React.createElement("a",props,props.children); }',
            loader: "js",
            resolveDir: process.cwd(),
          }))
        },
      },
    ],
  })
  await page.setViewportSize({ width: 1200, height: 950 })
  await page.setContent('<div id="fixture"></div>')
  await page.addStyleTag({
    content:
      ":root { --theme-surface:white; --theme-border:#ddd; --theme-heading:#222; --theme-muted:#666; --theme-text:#333; --theme-primary:#2271b1; } body { margin:0; font-family:Arial; } * {box-sizing:border-box} label {display:block} input,select {max-width:100%}",
  })
  for (const file of bundle.outputFiles) {
    if (file.path.endsWith(".css"))
      await page.addStyleTag({ content: file.text })
    else await page.addScriptTag({ content: file.text })
  }
})
test.afterEach(async ({ page }) => {
  expect(renderWarnings.get(page) || []).toEqual([])
})

test("broadsheet and dual-column blocks render every post without duplicate or displaced columns", async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1600, height: 1000 })
  for (const rtl of [false, true])
    for (const mode of ["broadsheet", "dual"])
      for (const width of [320, 1100])
        for (const count of [1, 2, 3, 4, 6, 7, 8, 12, 20]) {
          await page.evaluate(
            ({ mode, rtl, width, count }) =>
              window.StudioDesignFixture.render(
                mode,
                rtl,
                width,
                true,
                undefined,
                count
              ),
            { mode, rtl, width, count }
          )
          const titles = page.locator("#preview [data-studio-title]")
          await expect(titles).toHaveCount(count)
          const links = await titles.evaluateAll((items) =>
            items.map((item) => item.closest("a")?.getAttribute("href"))
          )
          expect(new Set(links).size).toBe(count)
          expect(
            await page
              .locator("#preview")
              .evaluate((el) => el.scrollWidth > el.clientWidth)
          ).toBe(false)
          if (mode === "broadsheet" && width === 1100 && count > 4) {
            const columns = page.locator(
              '#preview [data-broadsheet-columns="3"] > div'
            )
            await expect(columns).toHaveCount(3)
            const columnLinks = await columns.evaluateAll((items) =>
              items.map((column) =>
                Array.from(column.querySelectorAll("a[href*='/posts/']")).map(
                  (link) => link.getAttribute("href")
                )
              )
            )
            expect(columnLinks[1]).toHaveLength(1)
            expect(columnLinks[1][0]).toMatch(/\/posts\/story-0$/)
            expect(columnLinks[0].length - columnLinks[2].length).toBeLessThanOrEqual(1)
            expect(columnLinks[2].length - columnLinks[0].length).toBeLessThanOrEqual(1)
            const tops = await columns.evaluateAll((items) =>
              items.map((item) => item.getBoundingClientRect().top)
            )
            expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1)
          }
        }
})

test("zero legacy radius removes actual broadsheet and dual-card image clipping", async ({
  page,
}) => {
  for (const mode of ["broadsheet", "dual"]) {
    await page.evaluate(
      (mode) =>
        window.StudioDesignFixture.render(mode, false, 700, true, undefined, 8),
      mode
    )
    const image = page.locator("#preview [data-studio-image]").first()
    await expect(image).not.toHaveCSS("border-top-left-radius", "0px")
    await page
      .getByText("Element surface and inherited defaults", { exact: true })
      .click()
    const radius = page.getByRole("spinbutton", { name: /border radius/i })
    await expect(radius).toHaveValue("")
    await radius.fill("0")
    await expect(image).toHaveCSS("border-top-left-radius", "0px")
    for (const surface of await page
      .locator("#preview [data-studio-card]")
      .all())
      await expect(surface).toHaveCSS("border-top-left-radius", "0px")
  }
})

test("editor snapshot hydrates without an Undo attribute mismatch when live history changed", async ({
  page,
}) => {
  await page.evaluate(() => window.StudioDesignFixture.hydrateEditor())
  await expect(
    page.getByRole("button", { name: "Hydration undo" })
  ).toBeEnabled()
  expect(
    await page.evaluate(() => window.StudioDesignFixture.getHydrationErrors())
  ).toEqual([])
})

test("typography overrides, square corners and reset survive serialization", async ({
  page,
}) => {
  await page.evaluate(() => window.StudioDesignFixture.render())
  const title = page.locator("#preview h3").first()
  await expect(title).toHaveCSS("font-size", "15px")
  await page.getByLabel("Font size", { exact: true }).fill("24")
  await expect(title).toHaveCSS("font-size", "24px")
  await page.screenshot({
    path: "test-results/studio-design-controls.png",
    fullPage: true,
  })
  await page.getByLabel("Device override").selectOption("mobile")
  await page.getByLabel("Font size", { exact: true }).fill("18")
  await expect(title).toHaveCSS("font-size", "24px")
  // Studio's device buttons must work without resizing the actual browser.
  await page.evaluate(() =>
    window.StudioDesignFixture.render("compact", false, 300, false, "mobile")
  )
  await expect(title).toHaveCSS("font-size", "18px")
  await page.evaluate(() =>
    window.StudioDesignFixture.render("compact", false, 300, false, "desktop")
  )
  await expect(title).toHaveCSS("font-size", "24px")
  await page.evaluate(() =>
    window.StudioDesignFixture.render("compact", false, 300, false)
  )
  await page.setViewportSize({ width: 600, height: 950 })
  await expect(title).toHaveCSS("font-size", "18px")
  await page.evaluate(() =>
    window.StudioDesignFixture.render("compact", false, 300, false)
  )
  await expect(title).toHaveCSS("font-size", "18px")
  await page.getByText("Cards, images and list layout", { exact: true }).click()
  await page
    .getByRole("group", { name: "Card corners (px)", exact: true })
    .getByLabel("Top left")
    .fill("0")
  await expect(page.locator("#preview article").first()).toHaveCSS(
    "border-radius",
    "0px"
  )
  await page
    .getByRole("group", { name: "Image corners (px)", exact: true })
    .getByLabel("Top left")
    .fill("16")
  await expect(page.locator("#preview [data-studio-image]").first()).toHaveCSS(
    "border-top-left-radius",
    "16px"
  )
  await expect(page.locator("#preview img").first()).toHaveCSS(
    "border-top-left-radius",
    "16px"
  )
  await page
    .getByRole("combobox", { name: "Card border", exact: true })
    .selectOption("solid")
  await page.getByLabel("Border width (px)", { exact: true }).fill("2")
  await expect(page.locator("#preview article").first()).toHaveCSS(
    "border-top-width",
    "2px"
  )
  await page
    .getByRole("combobox", { name: "Card border", exact: true })
    .selectOption("none")
  await expect(page.locator("#preview article").first()).toHaveCSS(
    "border-top-style",
    "none"
  )
  await page.getByLabel("Device override").selectOption("mobile")
  await page
    .getByRole("button", { name: "Reset this text element on this device" })
    .click()
  await expect(title).toHaveCSS("font-size", "24px")
})

test("slider title and excerpt typography are independently controllable", async ({
  page,
}) => {
  await page.evaluate(() =>
    window.StudioDesignFixture.render("headline", false, 600)
  )
  await page.getByLabel("Font size", { exact: true }).fill("28")
  await page
    .getByRole("combobox", { name: "Font style", exact: true })
    .selectOption("italic")
  const title = page.locator("#preview h2[data-studio-title]")
  await expect(title).toHaveCSS("font-size", "28px")
  await expect(title).toHaveCSS("font-style", "italic")
  await page
    .getByRole("combobox", { name: "Text element", exact: true })
    .selectOption("excerpt")
  await page.getByLabel("Font size", { exact: true }).fill("17")
  await expect(page.locator("#preview [data-studio-excerpt]")).toHaveCSS(
    "font-size",
    "17px"
  )
  await expect(title).toHaveCSS("font-size", "28px")
})

test("narrow English and Arabic lists keep text and thumbnails inside their columns", async ({
  page,
}) => {
  for (const rtl of [false, true])
    for (const mode of ["list", "wire", "compact"]) {
      await page.evaluate(
        ({ mode, rtl }) => window.StudioDesignFixture.render(mode, rtl, 280),
        { mode, rtl }
      )
      await expect(page.locator("#preview article")).toHaveCount(3)
      const overflows = await page
        .locator("#preview")
        .evaluate((el) => el.scrollWidth > el.clientWidth)
      expect(overflows).toBe(false)
      const title = page
        .locator("#preview article h3, #preview article h4")
        .first()
      expect(
        await title.evaluate((el) => el.getBoundingClientRect().width)
      ).toBeGreaterThan(130)
      if (mode === "list") {
        const image = page.locator("#preview article img").first()
        expect((await title.boundingBox())!.y).toBeGreaterThan(
          (await image.boundingBox())!.y
        )
      }
    }
  await page.screenshot({
    path: "test-results/studio-design-arabic.png",
    fullPage: true,
  })
})
