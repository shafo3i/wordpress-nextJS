import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    route.request().url() === "http://featured.test/"
      ? route.fulfill({
          contentType: "text/html",
          body: '<div id="fixture"></div>',
        })
      : route.abort()
  )
})
for (const locale of ["en", "ar"] as const)
  test(`featured-video choices and image priority work in ${locale}`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en
    const bundle = await build({
      entryPoints: [
        fileURLToPath(
          new URL("./fixtures/featured-video.fixture.tsx", import.meta.url)
        ),
      ],
      bundle: true,
      write: false,
      format: "iife",
      platform: "browser",
      globalName: "FeaturedFixture",
      plugins: [
        {
          name: "featured-fixture",
          setup(builder) {
            builder.onResolve(
              {
                filter:
                  /^@\/components\/(site\/(header\/site-header|footer\/site-footer|sidebar\/sidebar-renderer|post-views|article-share|content-image)|admin\/media-select-modal)$/,
              },
              (args) => ({ path: args.path, namespace: "fixture" })
            )
            builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
              contents: args.path.endsWith("content-image")
                ? `import {createElement} from 'react';export function ContentImage({src,alt}){return createElement('img',{src,alt})}`
                : `export const SiteHeader=()=>null;export const SiteFooter=()=>null;export const SidebarWidgetRenderer=()=>null;export const PostViews=()=>null;export const ArticleShare=()=>null;export const MediaSelectModal=()=>null;`,
              loader: "js",
              resolveDir: fileURLToPath(new URL("..", import.meta.url)),
            }))
          },
        },
      ],
    })
    await page.goto("http://featured.test/")
    await page.addScriptTag({ content: bundle.outputFiles[0].text })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            FeaturedFixture: { render: (locale: "en" | "ar") => void }
          }
        ).FeaturedFixture.render(locale),
      locale
    )
    await expect(page.locator("[data-article-video] iframe")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    )
    await page
      .getByLabel(dict["admin.editor.featured_video_from_post"])
      .selectOption("/uploads/second.mp4")
    await expect(page.locator("[data-article-video] video")).toHaveAttribute(
      "src",
      "/uploads/second.mp4"
    )
    const localVideo =
      "/uploads/2026/04/WhatsApp-Video-2026-04-15-at-4.27.43-PM.mp4"
    await page
      .getByLabel(dict["admin.editor.featured_video_url"])
      .fill(localVideo)
    await expect(page.locator("[data-article-video] video")).toHaveAttribute(
      "src",
      localVideo
    )
    expect(
      await page
        .locator("[data-featured-video-form]")
        .evaluate((form) => (form as HTMLFormElement).checkValidity())
    ).toBe(true)
    await page
      .getByLabel(dict["admin.editor.featured_image"], { exact: true })
      .check()
    await expect(page.locator("[data-article-video]")).toHaveCount(0)
    await expect(page.locator("[data-article-image] img")).toHaveAttribute(
      "src",
      "/uploads/cover.jpg"
    )
    await page
      .getByLabel(dict["admin.editor.featured_video_url"])
      .fill("javascript:alert(1)")
    await expect(page.getByRole("alert")).toHaveText(
      dict["admin.editor.featured_video_invalid"]
    )
    await page
      .getByRole("button", { name: dict["admin.editor.featured_video_reset"] })
      .click()
    await expect(
      page.getByLabel(dict["admin.editor.featured_video_url"])
    ).toHaveValue("")
  })
