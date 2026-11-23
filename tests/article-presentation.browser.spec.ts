import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import type { ThemeMods } from "../lib/themes/types"
let bundle: string
let css: string
test.beforeAll(async () => {
  const result = await build({ entryPoints: ["tests/fixtures/article-presentation.fixture.tsx"], bundle: true, write: false, outdir: "tests/.article-bundle", platform: "browser", format: "iife", globalName: "ArticleFixture", plugins: [{ name: "article-fixture", setup(builder) {
    builder.onResolve({ filter: /^@\/components\/site\/(header\/site-header|footer\/site-footer|sidebar\/sidebar-renderer|post-views|article-share|content-image)$/ }, ({ path }) => ({ path, namespace: "fixture" }))
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ loader: "js", resolveDir: process.cwd(), contents: path.endsWith("content-image") ? "import {createElement} from 'react';export const ContentImage=({src,alt})=>createElement('img',{src,alt})" : "export const SiteHeader=()=>null;export const SiteFooter=()=>null;export const SidebarWidgetRenderer=()=>null;export const PostViews=()=>null;export const ArticleShare=()=>null;" }))
  } }] })
  bundle = result.outputFiles.find(file => file.path.endsWith(".js"))!.text
  css = result.outputFiles.find(file => file.path.endsWith(".css"))?.text || ""
})
for (const locale of ["en", "ar"] as const) {
  test(`article borders, corners and newsletter visibility follow settings in ${locale}`, async ({ page }) => {
    await page.route("**/*", route => route.abort())
    await page.setContent('<base href="https://article.test/"><div id="fixture"></div>')
    await page.addStyleTag({ content: "*{box-sizing:border-box}article.prose,[data-article-image],[data-newsletter-source]{border:1px solid gray;border-radius:16px;box-shadow:0 1px 3px gray}" })
    await page.addStyleTag({ content: css })
    await page.addScriptTag({ content: bundle })
    const render = async (mods: ThemeMods) => page.evaluate(({ locale, mods }) => (window as unknown as { ArticleFixture: { render: (locale: string, mods: ThemeMods) => void } }).ArticleFixture.render(locale, mods), { locale, mods })
    for (const singleLayout of ["sidebar-left", "sidebar-right", "full-container", "centered"] as const) {
      await render({ singleLayout, singleContentBorder: false, singleImageBorder: false, singleNewsletterBorder: false, singleContentRadius: 0, singleImageRadius: 0, singleNewsletterRadius: 0, singleContentShadow: false, singleNewsletterShadow: false })
      const article = page.locator("article.prose"), newsletter = page.locator('[data-newsletter-source="article_footer"]')
      await expect(article).toHaveCSS("border-top-width", "0px")
      await expect(article).toHaveCSS("border-radius", "0px")
      await expect(article).toHaveCSS("box-shadow", "none")
      await expect(page.locator("[data-article-image]")).toHaveCSS("border-top-width", "0px")
      await expect(page.locator("[data-article-image]")).toHaveCSS("border-radius", "0px")
      await expect(newsletter).toHaveCSS("border-top-width", "0px")
      await expect(newsletter).toHaveCSS("border-radius", "0px")
      await expect(newsletter).toHaveCSS("box-shadow", "none")
      await expect(newsletter.getByText("Managed newsletter title", { exact: true })).toBeVisible()
      await expect(newsletter.getByText("Managed newsletter description", { exact: true })).toBeVisible()
      await render({ singleLayout, singleContentBorder: true, singleNewsletterBorder: true, singleContentRadius: 12, singleNewsletterRadius: 8 })
      await expect(article).toHaveCSS("border-top-width", "1px")
      await expect(article).toHaveCSS("border-radius", "12px")
      await expect(newsletter).toHaveCSS("border-top-width", "1px")
      await expect(newsletter).toHaveCSS("border-radius", "8px")
      await render({ singleLayout, singleShowNewsletter: false })
      await expect(newsletter).toHaveCount(0)
      await expect(article).toBeVisible()
    }
  })
}
