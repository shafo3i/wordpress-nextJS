import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import type { HomepageBlockType } from "../lib/themes/homepage-types"
let files: { path: string; text: string }[]
for (const locale of ["en", "ar"] as const) {
  test(`independent category columns show the lead, thumbnails, headlines and correct More links (${locale})`, async ({ page }) => {
    await page.addStyleTag({ content: ".category-columns-fixture{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}.flex{display:flex}.justify-between{justify-content:space-between}@media(max-width:767px){.category-columns-fixture{grid-template-columns:1fr}}" })
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.evaluate(locale => (window as unknown as { EditorialFixture: { renderCategoryColumns: (locale: string) => void } }).EditorialFixture.renderCategoryColumns(locale), locale)
    const columns = page.locator("[data-category-column]")
    await expect(columns).toHaveCount(4)
    for (const [index, slug] of ["world", "region", "news", "culture"].entries()) {
      const column = columns.nth(index)
      await expect(column.locator("article")).toHaveCount(5)
      await expect(column.locator("[data-studio-image]")).toHaveCount(3)
      await expect(column.locator("[data-studio-section-heading] a")).toHaveAttribute("href", `${locale === "en" ? "/en" : ""}/category/${slug}`)
      await expect(column.locator("h2")).toHaveText(slug)
      for (const heading of await column.locator("[data-studio-title]").allTextContents()) expect(heading).toContain(slug)
    }
    const first = (await columns.nth(0).boundingBox())!, second = (await columns.nth(1).boundingBox())!
    expect(locale === "ar" ? first.x > second.x : first.x < second.x).toBe(true)
    await page.screenshot({ path: `test-results/category-columns-${locale}.png`, fullPage: true })
    await page.setViewportSize({ width: 375, height: 800 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect((await columns.nth(1).boundingBox())!.y).toBeGreaterThan((await columns.nth(0).boundingBox())!.y)
  })
}
for (const locale of ["en", "ar"] as const) {
  test(`article titles share hover and keyboard underlines across blocks (${locale})`, async ({ page }) => {
    await page.evaluate(() => (window as unknown as { EditorialFixture: { loadThemeCss: () => void } }).EditorialFixture.loadThemeCss())
    for (const displayStyle of ["compact_posts", "dual_columns", "numbered_strip", "split_cover", "grid_3", "newsroom_lead"]) {
      await page.evaluate(({ locale, displayStyle }) => (window as unknown as { EditorialFixture: { render: (...args: unknown[]) => void } }).EditorialFixture.render("news_list", locale, 9, displayStyle), { locale, displayStyle })
      await expect(page.locator("main[data-fixture-style]")).toHaveAttribute("data-fixture-style", displayStyle)
      const title = page.locator("[data-studio-title]").first()
      const child = title.locator("a").first()
      const link = await child.count() ? child : title.locator("xpath=ancestor-or-self::a[1]")
      await link.hover()
      await expect.poll(() => title.evaluate(element => getComputedStyle(element).textDecorationLine)).toContain("underline")
      await page.mouse.move(0, 0)
      await link.blur()
      await page.keyboard.press("Tab")
      await link.focus()
      await expect.poll(() => title.evaluate(element => getComputedStyle(element).textDecorationLine)).toContain("underline")
    }
  })
}
for (const locale of ["en", "ar"] as const) {
  test(`section category link follows language and can be hidden (${locale})`, async ({ page }) => {
    // This esbuild fixture has no Tailwind build; supply the existing header layout utilities.
    await page.addStyleTag({ content: ".flex{display:flex}.justify-between{justify-content:space-between}.items-baseline{align-items:baseline}" })
    await page.evaluate(locale => {
      (window as unknown as { EditorialFixture: { render: (...args: unknown[]) => void } }).EditorialFixture.render("category_grid", locale, 6, "grid_3", true)
    }, locale)
    const heading = page.locator("[data-studio-section-heading]")
    const link = heading.getByRole("link")
    await expect(link).toHaveAttribute("href", locale === "ar" ? "/category/news" : "/en/category/news")
    const titleBox = (await heading.locator("h2").boundingBox())!
    const linkBox = (await link.boundingBox())!
    expect(locale === "ar" ? titleBox.x > linkBox.x : titleBox.x < linkBox.x).toBe(true)
    await page.evaluate(locale => {
      (window as unknown as { EditorialFixture: { render: (...args: unknown[]) => void } }).EditorialFixture.render("category_grid", locale, 6, "grid_3", false)
    }, locale)
    await expect(heading.getByRole("link")).toHaveCount(0)
  })
}
for (const locale of ["en", "ar"] as const) {
  for (const variant of ["lead", "category", "strip"] as const) {
    test(`Newsroom ${variant} responsive layout (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 1000 })
      await page.evaluate(({ locale, variant }) => {
        (window as unknown as { EditorialFixture: { render: (...args: unknown[]) => void } }).EditorialFixture.render("newsroom", locale, 13, `newsroom_${variant}`)
      }, { locale, variant })
      const section = page.locator(`[data-newsroom="${variant}"]`)
      await expect(section.locator("article")).toHaveCount(13)
      expect(await section.getAttribute("dir")).toBe(locale === "ar" ? "rtl" : "ltr")
      const lead = section.locator('[data-newsroom-story="1"]')
      if (variant === "lead") {
        const middle = (await lead.boundingBox())!
        const side = (await section.locator('[data-newsroom-story="2"]').boundingBox())!
        expect(middle.width).toBeGreaterThan(side.width * 1.8)
        expect(locale === "ar" ? side.x > middle.x : side.x < middle.x).toBe(true)
      }
      await page.screenshot({ path: `test-results/newsroom-${variant}-${locale}-desktop.png`, fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
      await expect(section.locator("article")).toHaveCount(13)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      if (variant === "lead") {
        expect((await lead.boundingBox())!.y).toBeLessThan((await section.locator('[data-newsroom-story="2"]').boundingBox())!.y)
      }
      await page.screenshot({ path: `test-results/newsroom-${variant}-${locale}-mobile.png`, fullPage: true })
      if (variant === "lead") {
        await page.setViewportSize({ width: 1400, height: 1000 })
        for (const count of [1, 2]) {
          await page.evaluate(({ locale, count }) => {
            (window as unknown as { EditorialFixture: { render: (...args: unknown[]) => void } }).EditorialFixture.render("newsroom", locale, count, "newsroom_lead")
          }, { locale, count })
          await expect(section.locator("article")).toHaveCount(count)
          if (count === 1) expect((await lead.boundingBox())!.width).toBeGreaterThan((await section.boundingBox())!.width - 4)
        }
      }
    })
  }
}
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/editorial-layouts.fixture.tsx"],
    bundle: true,
    write: false,
    outdir: "test-results/editorial-fixture",
    platform: "browser",
    format: "iife",
    globalName: "EditorialFixture",
    plugins: [
      {
        name: "next-stubs",
        setup(builder) {
          builder.onResolve({ filter: /^next\/(link|image)$/ }, (args) => ({
            path: args.path,
            namespace: "next-stub",
          }))
          builder.onLoad({ filter: /.*/, namespace: "next-stub" }, (args) => ({
            contents: args.path.endsWith("link")
              ? "import React from 'react';export default p=>React.createElement('a',p,p.children)"
              : "import React from 'react';export default p=>React.createElement('img',p)",
            loader: "js",
            resolveDir: process.cwd(),
          }))
        },
      },
    ],
  })
  files = result.outputFiles
})
test.beforeEach(async ({ page }) => {
  await page.route("https://images.test/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#236878"/></svg>',
    })
  )
  await page.setContent('<div id="fixture"></div>')
  await page.addStyleTag({
    content:
      ":root{--theme-surface:#fff;--theme-heading:#111;--theme-text:#444;--theme-muted:#666;--theme-border:#ddd;--theme-primary:#2271b1}body{margin:16px;font-family:Arial;background:#f5f5f5}*{box-sizing:border-box}h1,h2,h3,p{margin:0}h3{color:#071226}button{font:inherit}",
  })
  for (const file of files)
    if (file.path.endsWith(".css"))
      await page.addStyleTag({ content: file.text })
    else await page.addScriptTag({ content: file.text })
})
for (const locale of ["en", "ar"] as const)
  test(`hero, wire and editorial grids (${locale})`, async ({ page }) => {
    const render = async (type: HomepageBlockType | "wire", count = 9) =>
      page.evaluate(
        ({ type, locale, count }) =>
          (
            window as unknown as {
              EditorialFixture: {
                render: (
                  type: HomepageBlockType | "wire",
                  locale: string,
                  count: number
                ) => void
              }
            }
          ).EditorialFixture.render(type, locale, count),
        { type, locale, count }
      )
    await page.setViewportSize({ width: 1400, height: 1000 })
    await render("featured_hero_slider", 5)
    const hero = page.locator("[data-featured-queue]")
    await expect(hero).toBeVisible()
  await expect(hero.locator('article[data-active="true"] h3')).toHaveCSS('color','rgb(255, 255, 255)')
  await expect(hero.locator('button[aria-pressed]').first()).toBeVisible()
  expect(await hero.innerText()).not.toMatch(/\d+\s*\/\s*\d+/)

    await expect(hero.locator('article[data-active="true"]')).toHaveCount(1)
    await hero.locator("button[aria-pressed]").nth(2).click()
    await expect(hero.locator('article[data-active="true"]')).toContainText(
      locale === "ar" ? "رقم 3" : "Story 3"
    )
    await expect(hero.locator('article[data-active="true"]')).toHaveCSS(
      "opacity",
      "1"
    )
    const bounds = await hero
      .locator('article[data-active="true"]')
      .boundingBox()
    expect(bounds!.height).toBeGreaterThan(390)
    for (const type of ["lead_story_grid", "headlines_grid"] as const) {
      await render(type, type === "headlines_grid" ? 9 : 7)
      await expect(
        page.locator("[data-editorial-collection] article")
      ).toHaveCount(type === "headlines_grid" ? 9 : 7)
      expect(
        await page
          .locator("[data-editorial-collection] article")
          .first()
          .boundingBox()
      ).toHaveProperty("x")
      await expect(
        page.getByRole("img", {
          name: locale === "ar" ? "فيديو" : "Video",
          exact: true,
          includeHidden: true,
        })
      ).toHaveCount(2)
      await page.screenshot({
        path: `test-results/editorial-${type}-${locale}.png`,
        fullPage: true,
      })
      await page.setViewportSize({ width: 390, height: 900 })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(390)
      await expect(
        page.locator("[data-editorial-collection] article").last()
      ).toBeVisible()
      await page.setViewportSize({ width: 1400, height: 1000 })
    }
    await render("wire", 5)
    const wire = page.locator("article").first()
    const titleBounds = await wire.locator("h4").boundingBox(),
      dateBounds = await wire.locator("[data-studio-meta]").last().boundingBox()
    expect(dateBounds!.y).toBeGreaterThan(titleBounds!.y)
    expect(Math.abs(dateBounds!.x - titleBounds!.x)).toBeLessThan(2)
    await render("headlines_grid", 18)
    await expect(
      page.locator("[data-editorial-collection] article")
    ).toHaveCount(18)

    await page.screenshot({
      path: `test-results/editorial-${locale}.png`,
      fullPage: true,
    })
  })
