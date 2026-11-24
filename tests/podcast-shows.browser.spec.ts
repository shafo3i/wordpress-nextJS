import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const result = await build({ entryPoints: ["tests/fixtures/podcast-shows.fixture.tsx"], bundle: true, write: false, platform: "browser", format: "iife", globalName: "PodcastFixture", plugins: [{ name: "podcast-fixture", setup(builder) {
    builder.onResolve({ filter: /^(next\/(navigation|link)|@\/components\/admin\/media-select-modal)$|^\.\.\/action$/ }, ({ path }) => ({ path, namespace: "fixture" }))
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ loader: "jsx", resolveDir: process.cwd(), contents: path === "next/link" ? "import React from 'react';export default p=><a {...p}/>" : path === "next/navigation" ? "export const useRouter=()=>({refresh(){},replace(url){window.podcastLocation=url}})" : path.includes("media-select-modal") ? "import React from 'react';export const MediaSelectModal=({onSelect})=><button type='button' onClick={()=>onSelect({id:9,mimeType:'image/jpeg',url:'/uploads/artwork.jpg'})}>Choose fixture image</button>" : "export const saveShowAction=async data=>{window.podcastSaved=Object.fromEntries(data);return window.podcastFailure?{error:'admin.podcasts.error.failed'}:{id:'1'}};export const deleteShowAction=async id=>{window.podcastDeleted=id;return {success:true}}" }))
  } }] })
  bundle = result.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const) {
  test(`show creation, media selection, recovery and pagination work (${locale})`, async ({ page }) => {
    const dict = locale === "en" ? en : ar
    await page.route("http://podcast.test/", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }))
    await page.route("**/uploads/**", route => route.abort())
    await page.goto("http://podcast.test/")
    await page.addScriptTag({ content: bundle })
    await page.evaluate(locale => (window as unknown as { PodcastFixture: { render: (locale: string) => void } }).PodcastFixture.render(locale), locale)
    await expect(page.getByLabel(dict["admin.podcasts.status"], { exact: true })).toHaveValue("draft")
    await expect(page.locator("td img")).toHaveCount(0)
    await page.getByLabel(dict["admin.podcasts.name"], { exact: true }).fill("Daily newsroom")
    await page.getByLabel(dict["admin.podcasts.language"], { exact: true }).last().selectOption(locale)
    await page.getByRole("button", { name: dict["admin.podcasts.select_artwork"] }).click()
    await page.getByRole("button", { name: "Choose fixture image" }).click()
    await expect(page.locator('input[name="artworkId"]')).toHaveValue("9")
    await page.evaluate(() => { (window as unknown as { podcastFailure: boolean }).podcastFailure = true })
    await page.getByRole("button", { name: dict["admin.podcasts.save"], exact: true }).click()
    await expect(page.getByRole("alert")).toHaveText(dict["admin.podcasts.error.failed"])
    await expect(page.getByLabel(dict["admin.podcasts.name"], { exact: true })).toHaveValue("Daily newsroom")
    await page.evaluate(() => { (window as unknown as { podcastFailure: boolean }).podcastFailure = false })
    await page.getByRole("button", { name: dict["admin.podcasts.save"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { podcastSaved: Record<string, string> }).podcastSaved)).toMatchObject({ name: "Daily newsroom", languageCode: locale, status: "draft", artworkId: "9" })
    await expect(page.getByRole("link", { name: dict["admin.podcasts.next"], exact: true }).first()).toHaveAttribute("href", `/admincp/podcasts/shows?page=2&s=news&lang=${locale}`)
    page.once("dialog", dialog => dialog.accept())
    await page.getByRole("button", { name: dict["admin.podcasts.delete"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { podcastDeleted: string }).podcastDeleted)).toBe("1")
    await page.evaluate(locale => (window as unknown as { PodcastFixture: { render: (locale: string, edit: boolean) => void } }).PodcastFixture.render(locale, true), locale)
    await expect(page.getByLabel(dict["admin.podcasts.name"], { exact: true })).toHaveValue("<img src=x onerror=alert(1)>")
    await page.getByLabel(dict["admin.podcasts.name"], { exact: true }).fill("Edited programme")
    await page.getByLabel(dict["admin.podcasts.status"], { exact: true }).selectOption("published")
    await page.getByRole("button", { name: dict["admin.podcasts.save"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { podcastSaved: Record<string, string> }).podcastSaved)).toMatchObject({ id: "1", name: "Edited programme", status: "published" })
    await expect(page.getByRole("link", { name: dict["admin.podcasts.cancel"], exact: true })).toHaveAttribute("href", "/admincp/podcasts/shows")
  })
}
