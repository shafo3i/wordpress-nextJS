import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const output = await build({
    entryPoints: ["tests/fixtures/widget-category.fixture.tsx"], bundle: true, write: false, platform: "browser", format: "iife", globalName: "WidgetCategoryFixture",
    plugins: [{ name: "widget-fixture", setup(builder) {
      builder.onResolve({ filter: /^\.\.\/actions$/ }, ({ importer }) => importer.endsWith("widgets-manager-shell.tsx") ? { path: "widgets/actions", namespace: "fixture" } : undefined)
      builder.onResolve({ filter: /^(next\/(link|navigation|image)|@\/app\/\(admin\)\/admincp\/widgets\/actions|@\/components\/site\/post-thumbnail)$/ }, ({ path }) => ({ path, namespace: "fixture" }))
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
        contents: path === "next/navigation" ? "export const useRouter=()=>({refresh(){}})"
          : path.includes("widgets/actions") ? "export const saveWidgetAreaAction=async()=>({success:true})"
          : path.includes("post-thumbnail") ? "export const PostThumbnail=()=>null"
          : "import React from 'react';export default ({children,...props})=>React.createElement('a',props,children)",
        loader: "js", resolveDir: process.cwd(),
      }))
    } }],
  })
  bundle = output.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const) {
  test(`widget categories and fourth footer label work in ${locale}`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en
    const requests: string[] = []
    let failure = false
    let empty = false
    await page.route("http://widgets.test/", (route) => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }))
    await page.route("**/api/widgets/posts?**", (route) => {
      requests.push(route.request().url())
      if (failure) return route.fulfill({ status: 503, json: { error: "unavailable" } })
      if (empty) return route.fulfill({ json: { posts: [] } })
      return route.fulfill({ json: { posts: [{ id: "1", title: "Older category story", slug: "older-story", date: "2020-01-01T00:00:00.000Z", categories: ["Selected"], tags: [], excerpt: "Category result", authorName: "Writer", imageUrl: "", locale }] } })
    })
    await page.goto("http://widgets.test/")
    await page.addScriptTag({ content: bundle })
    await page.evaluate((locale) => (window as unknown as { WidgetCategoryFixture: { render: (locale: "en" | "ar") => void } }).WidgetCategoryFixture.render(locale), locale)
    await expect(page.getByText(dict["admin.widgets.area.footer_4.title"], { exact: true })).toBeVisible()
    const selectors = page.getByLabel(dict["admin.widgets.category_filter"], { exact: true })
    await expect(selectors).toHaveCount(2)
    await expect(selectors.first()).toHaveValue("legacy")
    const categoryId = locale === "ar" ? "22" : "11"
    await expect(selectors.first().locator(`option[value="${locale === "ar" ? "11" : "22"}"]`)).toHaveCount(0)
    await selectors.first().selectOption(categoryId)
    await selectors.nth(1).selectOption(categoryId)
    await expect(page.getByText("Older category story", { exact: true })).toHaveCount(2)
    await expect(page.getByText("Unrelated page post", { exact: true })).toHaveCount(0)
    expect(requests).toHaveLength(1)
    const url = new URL(requests[0])
    expect(url.searchParams.get("categoryId")).toBe(categoryId)
    expect(url.searchParams.get("locale")).toBe(locale)
    expect(url.searchParams.get("limit")).toBe("5")
    expect(JSON.parse(await page.locator("#widget-config").textContent() || "[]")).toEqual([{ categoryFilter: "", categoryId }, { count: 5, categoryId, categoryFilter: "" }])
    empty = true
    const otherId = locale === "ar" ? "23" : "12"
    await selectors.first().selectOption(otherId)
    await selectors.nth(1).selectOption(otherId)
    await expect.poll(() => requests.length).toBe(2)
    await expect(page.getByText("Older category story", { exact: true })).toHaveCount(0)
    await expect(page.getByText("Unrelated page post", { exact: true })).toHaveCount(0)
    empty = false
    failure = true
    // A new count creates an uncached request while preserving the selected ID.
    await page.locator('input[type="number"]').first().fill("4")
    await expect(page.getByText(dict["site.widgets.unavailable"], { exact: true })).toBeVisible()
    await expect(page.getByText("Unrelated page post", { exact: true })).toHaveCount(0)
  })
}
