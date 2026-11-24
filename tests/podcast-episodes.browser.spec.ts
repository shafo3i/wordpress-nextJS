import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let files: { path: string; text: string }[]
test.beforeAll(async () => {
  const result = await build({ entryPoints: ["tests/fixtures/podcast-episodes.fixture.tsx"], bundle: true, write: false, outdir: "tests/.episode-fixture", format: "iife", platform: "browser", globalName: "EpisodeFixture", plugins: [{ name: "episode-fixture", setup(builder) {
    builder.onResolve({ filter: /^(next\/(navigation|link)|@\/components\/admin\/media-select-modal)$|^\.\.\/action$/ }, ({ path }) => ({ path, namespace: "fixture" }))
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ loader: "jsx", resolveDir: process.cwd(), contents: path === "next/link" ? "import React from 'react';export default p=><a {...p}/>" : path === "next/navigation" ? "export const useRouter=()=>({replace(url){window.episodeLocation=url},refresh(){}})" : path.includes("media-select-modal") ? "import React from 'react';export const MediaSelectModal=({mediaType,onSelect})=><button type='button' onClick={()=>onSelect({id:mediaType==='audio'?81:mediaType==='video'?82:83,mimeType:mediaType==='image'?'image/jpeg':mediaType==='audio'?'audio/mpeg':'video/mp4',url:mediaType==='audio'?'/uploads/episode.mp3':mediaType==='video'?'/uploads/episode.mp4':'/uploads/artwork.jpg'})}>Choose fixture media</button>" : "export const saveEpisodeAction=async data=>{window.episodeSaved=Object.fromEntries(data);return window.episodeFailure?{error:'admin.podcasts.episode_error.failed'}:{id:'11'}};export const deleteEpisodeAction=async id=>{window.episodeDeleted=id;return {success:true}};export const searchEpisodeShowsAction=async query=>{window.episodeShowQuery=query;return {items:query.page===1?Array.from({length:20},(_,i)=>({id:String(i+1),name:'Show '+(i+1)})):[{id:'42',name:'Show on next page'}],total:21,page:query.page}}" }))
  } }] })
  files = result.outputFiles
})
for (const locale of ["en", "ar"] as const) {
  test(`episode media, paged shows, save recovery and language switching (${locale})`, async ({ page }) => {
    const dict = locale === "en" ? en : ar
    await page.route("http://episodes.test/", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }))
    await page.route("**/uploads/**", route => route.abort())
    await page.route("**youtube-nocookie.com/**", route => route.abort())
    await page.goto("http://episodes.test/")
    for (const file of files) if (file.path.endsWith(".css")) await page.addStyleTag({ content: file.text }); else await page.addScriptTag({ content: file.text })
    await page.evaluate(locale => (window as unknown as { EpisodeFixture: { render: (locale: string) => void } }).EpisodeFixture.render(locale), locale)
    await page.getByLabel(dict["admin.podcasts.episode_title"], { exact: true }).fill("Episode one")
    await expect(page.getByLabel(dict["admin.podcasts.status"], { exact: true })).toHaveValue("draft")
    await page.getByRole("button", { name: dict["admin.podcasts.next"], exact: true }).click()
    await expect(page.getByLabel(dict["admin.podcasts.episode_show"], { exact: true }).locator('option[value="42"]')).toHaveCount(1)
    await page.getByLabel(dict["admin.podcasts.episode_show"], { exact: true }).selectOption("42")
    await page.getByRole("button", { name: dict["admin.podcasts.select_audio"] }).click()
    await page.getByRole("button", { name: "Choose fixture media" }).click()
    await expect(page.locator('input[name="audioId"]')).toHaveValue("81")
    await page.getByLabel(dict["admin.podcasts.video_url"], { exact: true }).fill("https://youtu.be/4vOhXPaGsH0")
    await page.getByRole("button", { name: dict["admin.podcasts.preview_audio"] }).click()
    await expect(page.locator("audio")).toHaveCount(1)
    await page.getByRole("button", { name: dict["admin.podcasts.preview_video"] }).click()
    await expect(page.locator("audio")).toHaveCount(0)
    await expect(page.locator("iframe")).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/4vOhXPaGsH0")
    await page.evaluate(() => { (window as unknown as { episodeFailure: boolean }).episodeFailure = true })
    await page.getByRole("button", { name: dict["admin.podcasts.save_episode"], exact: true }).click()
    await expect(page.getByRole("alert")).toHaveText(dict["admin.podcasts.episode_error.failed"])
    await expect(page.getByLabel(dict["admin.podcasts.episode_title"], { exact: true })).toHaveValue("Episode one")
    await page.evaluate(() => { (window as unknown as { episodeFailure: boolean }).episodeFailure = false })
    await page.getByLabel(dict["admin.podcasts.status"], { exact: true }).selectOption("publish")
    await page.getByRole("button", { name: dict["admin.podcasts.save_episode"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { episodeSaved: Record<string, string> }).episodeSaved)).toMatchObject({ postTitle: "Episode one", showId: "42", audioId: "81", audioUrl: "/uploads/episode.mp3", videoUrl: "https://youtu.be/4vOhXPaGsH0", languageCode: locale, status: "publish" })
    await expect(page.getByRole("link", { name: dict["admin.podcasts.next"], exact: true }).first()).toHaveAttribute("href", `/admincp/podcasts/episodes?page=2&s=test&lang=${locale}&status=draft`)
    await expect(page.locator("td img")).toHaveCount(0)
    await page.getByLabel(dict["admin.podcasts.language"], { exact: true }).selectOption(locale === "en" ? "ar" : "en")
    await expect(page.getByLabel(dict["admin.podcasts.episode_show"], { exact: true })).toHaveValue("")
    await expect.poll(() => page.evaluate(() => (window as unknown as { episodeShowQuery: { language: string } }).episodeShowQuery.language)).toBe(locale === "en" ? "ar" : "en")
    page.once("dialog", dialog => dialog.accept())
    await page.getByRole("button", { name: dict["admin.podcasts.delete"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { episodeDeleted: string }).episodeDeleted)).toBe("9")
    await page.evaluate(locale => (window as unknown as { EpisodeFixture: { render: (locale: string, edit: boolean) => void } }).EpisodeFixture.render(locale, true), locale)
    await expect(page.getByLabel(dict["admin.podcasts.episode_title"], { exact: true })).toHaveValue("Stored episode")
    await expect(page.getByLabel(dict["admin.podcasts.episode_show"], { exact: true })).toHaveValue("42")
    await expect(page.locator('input[name="audioId"]')).toHaveValue("81")
    await page.getByRole("button", { name: dict["admin.podcasts.save_episode"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { episodeSaved: Record<string, string> }).episodeSaved)).toMatchObject({ id: "11", showId: "42", audioId: "81", audioUrl: "/uploads/stored.mp3", status: "draft" })
  })
}
