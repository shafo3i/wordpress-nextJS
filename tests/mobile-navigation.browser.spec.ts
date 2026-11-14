import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let files: { path: string; text: string }[]
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
                showTopBar: boolean
              ) => void
            }
          }
        ).MobileNavigationFixture.render(locale, "classic", false),
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
