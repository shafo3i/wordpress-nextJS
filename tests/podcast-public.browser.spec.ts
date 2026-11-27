import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { readFile } from "node:fs/promises"
import tailwind from "@tailwindcss/postcss"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
let css: string
let pagesBundle: string
let layoutCss: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/podcast-player.fixture.tsx"],
    bundle: true,
    write: false,
    outdir: "tests/.podcast-player",
    platform: "browser",
    format: "iife",
    globalName: "PlayerFixture",
  })
  bundle = result.outputFiles.find((file) => file.path.endsWith(".js"))!.text
  css =
    result.outputFiles.find((file) => file.path.endsWith(".css"))?.text || ""
  const pages = await build({
    entryPoints: ["tests/fixtures/podcast-public.fixture.tsx"],
    bundle: true,
    write: false,
    outdir: "tests/.podcast-public",
    platform: "browser",
    format: "iife",
    globalName: "PublicFixture",
    plugins: [
      {
        name: "public-podcast-fixture",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(next\/(link|navigation)|@\/lib\/(site-theme|widgets\/db)|@\/services\/podcast-public.service|@\/components\/site\/(header\/site-header|footer\/site-footer|theme-dynamic-styles|admin\/public-admin-bar))$/,
            },
            ({ path }) => ({ path, namespace: "fixture" })
          )
          builder.onLoad(
            { filter: /.*/, namespace: "fixture" },
            ({ path }) => ({
              loader: "jsx",
              resolveDir: process.cwd(),
              contents:
                path === "next/link"
                  ? "import React from 'react';export default ({children,...props})=><a {...props}>{children}</a>"
                  : path === "next/navigation"
                    ? "export const notFound=()=>{throw Error('Not found')};export const redirect=()=>{throw Error('Redirect')}"
                    : path.endsWith("site-theme")
                      ? "export const getFrontEndThemeContext=async()=>window.podcastTheme"
                      : path.endsWith("widgets/db")
                        ? "export const getAllWidgetAreas=async()=>[]"
                        : path.includes("podcast-public.service")
                          ? "export const getPublicPodcastShow=async()=>window.podcastShow;export const getPublicPodcastEpisode=async()=>window.podcastEpisode;export const listPublicPodcastShows=async()=>({items:[window.podcastShow],page:1,totalPages:1});export const listPublicPodcastEpisodes=async()=>({items:[window.podcastEpisode],page:1,totalPages:1})"
                          : "export const SiteHeader=()=>null;export const SiteFooter=()=>null;export const ThemeDynamicStyles=()=>null;export const PublicAdminBar=({children})=>children;",
            })
          )
        },
      },
    ],
  })
  pagesBundle = pages.outputFiles.find((file) =>
    file.path.endsWith(".js")
  )!.text
  const require = createRequire(import.meta.url)
  const postcss = createRequire(require.resolve("@tailwindcss/postcss"))(
    "postcss"
  )
  layoutCss = (
    await postcss([tailwind()]).process(
      '@import "tailwindcss" source(none); @source "./components/site/podcasts";',
      { from: resolve("podcast-fixture.css") }
    )
  ).css
})

for (const locale of ["ar", "en"] as const)
  test(`public podcast layouts fit desktop and mobile (${locale})`, async ({
    page,
  }, testInfo) => {
    await page.route("**/*", async (route) =>
      route.request().url().endsWith("arabic-demo-cover.png")
        ? route.fulfill({
            contentType: "image/png",
            body: await readFile("public/demo/podcasts/arabic-demo-cover.png"),
          })
        : route.abort()
    )
    await page.setContent(
      '<base href="https://podcast.test/"><div id="fixture"></div>'
    )
    await page.addStyleTag({
      content:
        layoutCss +
        "\n:root{--theme-bg:#f8f7f4;--theme-text:#1d2327;--theme-heading:#102f32;--theme-surface:#fff;--theme-muted:#536267;--theme-border:#d5dbda;--theme-primary:#102f32;--theme-on-primary:#fff}body{font-family:Tahoma,sans-serif}",
    })
    await page.addScriptTag({ content: pagesBundle })
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      for (const mode of ["directory", "show", "episode"] as const) {
        await page.evaluate(
          ({ locale, mode }) =>
            (
              window as unknown as {
                PublicFixture: {
                  render: (locale: string, mode: string) => Promise<void>
                }
              }
            ).PublicFixture.render(locale, mode),
          { locale, mode }
        )
        await expect(page.locator("h1")).toHaveCount(1)
        await expect(page.locator("main")).toBeVisible()
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth
            )
          )
          .toBe(true)
        if (mode === "show" && width === 390 && locale === "ar")
          await page.screenshot({
            path: testInfo.outputPath("arabic-show-mobile.png"),
            fullPage: true,
          })
      }
    }
  })
for (const locale of ["en", "ar"] as const)
  test(`podcast playback switches exclusively and rejects unsafe sources (${locale})`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en
    await page.route("**/*", (route) => route.abort())
    await page.setContent(
      '<base href="https://podcast.test/"><div id="fixture"></div>'
    )
    await page.addStyleTag({ content: css })
    await page.addScriptTag({ content: bundle })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            PlayerFixture: {
              render: (locale: string, unsafe?: boolean) => void
            }
          }
        ).PlayerFixture.render(locale),
      locale
    )
    await expect(page.locator("audio")).toHaveAttribute("preload", "none")
    await expect(page.locator("video")).toHaveCount(0)
    await page
      .getByRole("button", { name: dict["site.podcasts.watch"], exact: true })
      .click()
    await expect(page.locator("audio")).toHaveCount(0)
    await expect(page.locator("video")).toHaveCount(1)
    await expect(page.locator("video")).toHaveAttribute("aria-label", "Episode")
    await expect(page.locator("video")).toHaveAttribute("preload", "none")
    await page.evaluate(() => {
      const element = document.querySelector("video")!
      const calls: string[] = []
      element.pause = () => { calls.push("pause") }
      element.load = () => { calls.push(element.hasAttribute("src") ? "load-source" : "load-empty") }
      ;(window as unknown as { releasedVideo: { element: HTMLVideoElement; calls: string[] } }).releasedVideo = { element, calls }
    })
    await expect(page.getByText("Episode", { exact: true })).toHaveCount(0)
    await page
      .getByRole("button", { name: dict["site.podcasts.listen"], exact: true })
      .click()
    await expect(page.locator("video")).toHaveCount(0)
    expect(await page.evaluate(() => {
      const { element, calls } = (window as unknown as { releasedVideo: { element: HTMLVideoElement; calls: string[] } }).releasedVideo
      return { source: element.getAttribute("src"), calls }
    })).toEqual({ source: null, calls: ["pause", "load-empty"] })
    await expect(page.locator("audio")).toHaveCount(1)
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            PlayerFixture: {
              render: (locale: string, unsafe?: boolean) => void
            }
          }
        ).PlayerFixture.render(locale, true),
      locale
    )
    await expect(page.locator("audio,video,iframe")).toHaveCount(0)
  })
