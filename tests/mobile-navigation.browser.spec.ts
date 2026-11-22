import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let files: { path: string; text: string }[]
test("compact logo uses its natural width and text-only hover uses the configured colour", async ({ page }) => {
  await page.route("https://images.test/brand.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80"><rect width="40" height="80" fill="navy"/></svg>' }))
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.setContent('<div id="fixture"></div>')
  await page.addStyleTag({ content: "body{font-family:serif;font-size:20px;line-height:1.8}" })
  for (const file of files) {
    if (file.path.endsWith(".css")) await page.addStyleTag({ content: file.text })
    else await page.addScriptTag({ content: file.text })
  }
  await page.evaluate(() => (window as unknown as { MobileNavigationFixture: { render: (...args: unknown[]) => void } }).MobileNavigationFixture.render("en", "inline-news", false, "solid", true, true, { inlineTitleLanguages: "en", navHoverStyle: "text", navActiveStyle: "none", navLinkColor: "#111111", navLinkHoverColor: "#be123c" }))
  const image = page.locator("[data-inline-brand] img")
  await expect(image).toBeVisible()
  const bounds = (await image.boundingBox())!
  expect(bounds.width / bounds.height).toBeCloseTo(0.5, 1)
  const titleBounds = (await page.locator("[data-inline-title]").boundingBox())!
  const navBounds = (await page.locator("[data-site-navigation]").boundingBox())!
  expect(Math.abs(titleBounds.y + titleBounds.height / 2 - (navBounds.y + navBounds.height / 2))).toBeLessThan(1)
  const link = page.locator('[data-mobile-open] a').first()
  await page.mouse.move(0, 0)
  await expect.poll(() => link.evaluate(element => getComputedStyle(element).color)).toBe("rgb(17, 17, 17)")
  await link.hover()
  await expect.poll(() => link.evaluate(element => getComputedStyle(element).color)).toBe("rgb(190, 18, 60)")
  expect(await link.evaluate(element => getComputedStyle(element).boxShadow)).toBe("none")
})
for (const locale of ["en", "ar"] as const) {
  test(`navbar title respects language selection and independent link styles (${locale})`, async ({ page }) => {
    await page.route("https://images.test/brand.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="navy"/></svg>' }))
    await page.setContent('<div id="fixture"></div>')
    await page.addStyleTag({ content: "body{margin:0}*{box-sizing:border-box}.theme-container{max-width:1280px;margin-inline:auto}" })
    for (const file of files) {
      if (file.path.endsWith(".css")) await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    const render = (languages: string, hover = "outline", active = "background") => page.evaluate(({ locale, languages, hover, active }) => {
      (window as unknown as { MobileNavigationFixture: { render: (...args: unknown[]) => void } }).MobileNavigationFixture.render(locale, "inline-news", false, "solid", true, true, { inlineTitleLanguages: languages, navHoverStyle: hover, navActiveStyle: active })
    }, { locale, languages, hover, active })
    await render("en")
    const brand = page.locator("[data-inline-brand]")
    await expect(brand.locator("[data-inline-title]")).toHaveCount(locale === "en" ? 1 : 0)
    await expect(brand.getByRole("link")).toHaveAttribute("aria-label", locale === "en" ? "Newsroom" : "غرفة الأخبار")
    await render("en,ar")
    await expect(brand.locator("[data-inline-title]")).toBeVisible()
    const links = page.locator("[data-mobile-open]")
    await expect(links).toHaveAttribute("data-hover-style", "outline")
    await expect(links).toHaveAttribute("data-active-style", "background")
    const link = links.locator("a").first()
    await link.hover()
    expect(await link.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe("none")
    await link.evaluate(element => { element.setAttribute("aria-current", "page") })
    expect(await link.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)")
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 800 })
      await expect(brand.locator("[data-inline-title]")).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.locator("header").screenshot({ path: `test-results/nav-title-${locale}-${width}.png` })
    }
    await render("", "none", "none")
    await expect(brand.locator("[data-inline-title]")).toHaveCount(0)
    await brand.locator("img").evaluate(image => image.dispatchEvent(new Event("error")))
    await expect(brand.locator("img")).toHaveCount(0)
    await expect(brand.getByRole("link")).toHaveText(locale === "en" ? "Newsroom" : "غرفة الأخبار")
  })
}
test("open inline menu has an opaque backing when navigation background is transparent", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.setContent('<div id="fixture"></div><main style="height:800px">Article content underneath the menu</main>')
  for (const file of files) {
    if (file.path.endsWith(".css")) await page.addStyleTag({ content: file.text })
    else await page.addScriptTag({ content: file.text })
  }
  await page.evaluate(() => (window as unknown as { MobileNavigationFixture: { render: (...args: unknown[]) => void } }).MobileNavigationFixture.render("en", "inline-news", false, "solid", true, false, { navBarBg: "transparent" }))
  await page.getByRole("button", { name: en["site.navigation.open"], exact: true }).click()
  const drawer = page.locator('[data-mobile-open="true"]')
  await expect(drawer).toBeVisible()
  expect(await drawer.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)")
  await page.setViewportSize({ width: 420, height: 800 })
  await expect(drawer).toBeVisible()
  expect(await drawer.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)")
})
for (const locale of ["en", "ar"] as const) {
  test(`balanced masthead keeps the logo centred and utilities responsive (${locale})`, async ({ page }) => {
    await page.route("https://images.test/brand.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><rect width="240" height="100" fill="#173e40"/><text x="120" y="57" fill="white" font-size="22" text-anchor="middle">NEWSROOM</text></svg>' }))
    await page.setContent('<div id="fixture"></div>')
    await page.addStyleTag({ content: "body{margin:0;font-family:Arial}*{box-sizing:border-box}.theme-container{max-width:1280px;margin-inline:auto}.sticky{position:sticky}#fixture{min-height:1800px}" })
    for (const file of files) {
      if (file.path.endsWith(".css")) await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    const render = async (details: boolean) => page.evaluate(({ locale, details }) => {
      (window as unknown as { MobileNavigationFixture: { render: (...args: unknown[]) => void } }).MobileNavigationFixture.render(locale, "classic", true, "solid", details, true)
    }, { locale, details })
    await page.setViewportSize({ width: 1400, height: 800 })
    await render(true)
    const header = page.locator('header[data-masthead-details="true"]')
    await expect(header.locator("[data-masthead-publication] p")).toBeVisible()
    await expect(header.locator("time")).toHaveAttribute("datetime", "2026-11-19T12:00:00.000Z")
    await expect(header.locator('[data-masthead-utilities] a[hreflang]')).toHaveCount(2)
    await expect(header.locator('a[href="https://example.test/facebook"]')).toHaveCount(1)
    await expect(header.locator('a[href*="cms-admin"],a[href*="register"]')).toHaveCount(0)
    const image = (await header.locator("img").boundingBox())!
    expect(Math.abs(image.x + image.width / 2 - 700)).toBeLessThan(2)
    await header.screenshot({ path: `test-results/masthead-${locale}-desktop.png` })
    await page.setViewportSize({ width: 320, height: 800 })
    await expect(header.locator("[data-masthead-publication]")).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const dict = locale === "ar" ? ar : en
    await expect(header.locator("[data-site-navigation]").getByRole("link", { name: dict["site.search.label"], exact: true })).toBeVisible()
    await header.screenshot({ path: `test-results/masthead-${locale}-mobile.png` })
    await page.evaluate(() => window.scrollTo(0, 400))
    await expect.poll(async () => Math.abs((await header.locator("[data-site-navigation]").boundingBox())!.y)).toBeLessThan(2)
    await page.evaluate(() => window.scrollTo(0, 0))
    await render(false)
    await expect(page.locator("[data-masthead-publication]")).toHaveCount(0)
  })
}

for (const locale of ["en", "ar"] as const) {
  test(`inline news header has one brand, working drawer and configurable borders in ${locale}`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en
    await page.setContent('<div id="fixture"></div>')
    await page.addStyleTag({ content: "body{margin:0}*{box-sizing:border-box}.theme-container{max-width:1280px;margin-inline:auto}" })
    for (const file of files) {
      if (file.path.endsWith(".css")) await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    for (const borderStyle of ["none", "solid", "double"] as const) {
      await page.evaluate(({ locale, borderStyle }) => (window as unknown as { MobileNavigationFixture: { render: (locale: string, layout: string, topbar: boolean, border: string) => void } }).MobileNavigationFixture.render(locale, "inline-news", false, borderStyle), { locale, borderStyle })
      const header = page.locator('header[data-layout="inline-news"]')
      await expect(header).toBeVisible()
      expect(await header.evaluate(element => getComputedStyle(element).borderBottomStyle)).toBe(borderStyle)
      if (borderStyle !== "none") expect(await header.evaluate(element => getComputedStyle(element).borderBottomWidth)).toBe("3px")
    }
    const nav = page.locator("[data-site-navigation]")
    await expect(nav.locator("[data-inline-brand]")).toBeVisible()
    await expect(page.locator("[data-inline-brand]")).toHaveCount(1)
    for (const width of [320, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 })
      const toggle = nav.getByRole("button", { name: dict["site.navigation.open"], exact: true })
      await expect(toggle).toBeVisible()
      await toggle.click()
      await expect(nav.locator("[data-mobile-open]")).toHaveAttribute("data-mobile-open", "true")
      await expect(nav.locator("[data-mobile-open] a").first()).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(toggle).toBeFocused()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(nav.getByRole("link", { name: dict["site.search.label"], exact: true })).toBeVisible()
    }
    await page.screenshot({ path: `.local/dev-performance/inline-header-${locale}.png` })
  })
}
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/mobile-navigation.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    outdir: "out",
    format: "iife",
    platform: "browser",
    globalName: "MobileNavigationFixture",
    plugins: [
      {
        name: "next-header-fixture",
        setup(builder) {
          builder.onResolve(
            { filter: /^next\/(link|navigation)$/ },
            (args) => ({ path: args.path, namespace: "fixture" })
          )
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents:
              args.path === "next/link"
                ? `import {createElement} from 'react';export default function Link(props){return createElement('a',props,props.children)}`
                : `export function usePathname(){return '/en'}`,
            loader: "js",
            resolveDir: fileURLToPath(new URL("..", import.meta.url)),
          }))
        },
      },
    ],
  })
  files = result.outputFiles
})
for (const locale of ["en", "ar"] as const)
  test(`navigation is usable without horizontal page overflow in ${locale}`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en
    await page.route("http://navigation.test/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="fixture"></div>',
      })
    )
    await page.goto("http://navigation.test/")
    await page.addStyleTag({
      content:
        "body{margin:0}*{box-sizing:border-box}.mx-auto{margin-inline:auto}button,a{-webkit-tap-highlight-color:transparent}",
    })
    for (const file of files) {
      if (file.path.endsWith(".css"))
        await page.addStyleTag({ content: file.text })
      else await page.addScriptTag({ content: file.text })
    }
    await page.evaluate(() =>
      document.addEventListener(
        "click",
        (event) => {
          if ((event.target as Element).closest("a")) event.preventDefault()
        },
        true
      )
    )
    for (const layout of [
      "classic",
      "magazine",
      "minimal",
      "centered",
    ] as const) {
      await page.evaluate(
        ({ locale, layout }) =>
          (
            window as unknown as {
              MobileNavigationFixture: {
                render: (
                  locale: "en" | "ar",
                  layout: "classic" | "magazine" | "minimal" | "centered"
                ) => void
              }
            }
          ).MobileNavigationFixture.render(locale, layout),
        { locale, layout }
      )
      for (const width of [320, 375, 500, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 })
        const nav = page.locator("[data-site-navigation]")
        await expect(nav).toBeVisible()
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true)
        await expect(
          nav.getByRole("link", {
            name: dict["site.search.label"],
            exact: true,
          })
        ).toBeVisible()
        if (width < 768) {
          const button = nav.getByRole("button", {
            name: dict["site.navigation.open"],
          })
          await expect(button).toHaveAttribute("aria-expanded", "false")
          await expect(
            nav.locator("[data-mobile-open] a").first()
          ).not.toBeVisible()
          await button.click()
          const close = nav.getByRole("button", {
            name: dict["site.navigation.close"],
          })
          await expect(close).toHaveAttribute("aria-expanded", "true")
          const links = nav.locator("[data-mobile-open] a")
          await expect(links).toHaveCount(12)
          await links.last().scrollIntoViewIfNeeded()
          await expect(links.last()).toBeVisible()
          expect(
            await links
              .first()
              .evaluate((element) => element.getBoundingClientRect().height)
          ).toBeGreaterThanOrEqual(44)
          await page.keyboard.press("Escape")
          await expect(button).toHaveAttribute("aria-expanded", "false")
          await expect(button).toBeFocused()
          await button.click()
          await links.first().click()
          await expect(button).toHaveAttribute("aria-expanded", "false")
        } else {
          await expect(
            nav.getByRole("button", { includeHidden: true })
          ).toHaveCount(1)
          await expect(
            nav.getByRole("button", { includeHidden: true })
          ).not.toBeVisible()
          await expect(
            nav.locator("[data-mobile-open] a").first()
          ).toBeVisible()
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 800 })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            MobileNavigationFixture: {
              render: (
                locale: "en" | "ar",
                layout: "classic",
                showTopBar: boolean,
                border: string,
                details: boolean
              ) => void
            }
          }
        ).MobileNavigationFixture.render(locale, "classic", false, "solid", false),
      locale
    )
    const navigation = page.locator("[data-site-navigation]")
    await expect(
      navigation.getByRole("link", {
        name: dict["site.search.label"],
        exact: true,
      })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await navigation
      .getByRole("button", { name: dict["site.navigation.open"] })
      .click()
    await expect(
      navigation.getByRole("link", { name: "Facebook", exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
