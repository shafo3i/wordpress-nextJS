import { test, expect, type Page } from "@playwright/test"
import { sanitizePluginMarkup } from "../lib/plugins/markup"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
import { factReviewSchema } from "../db/schema/cms-fact-reviews"
let bundle: string
test("newsletter confirmation form preserves token, language and browser origin", async ({
  page,
}) => {
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL("../lib/newsletter/token-page.ts", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    plugins: [
      {
        name: "newsletter-language",
        setup(builder) {
          builder.onResolve({ filter: /^@\/lib\/email-language$/ }, () => ({
            path: "language",
            namespace: "newsletter-fixture",
          }))
          builder.onLoad(
            { filter: /.*/, namespace: "newsletter-fixture" },
            () => ({
              contents:
                'export const getEmailLanguage=async()=>({code:"ar",direction:"rtl",dict:{"site.newsletter.confirm":"Confirm"}})',
            })
          )
        },
      },
    ],
  })
  const loadedModule = {
    exports: {} as typeof import("../lib/newsletter/token-page"),
  }
  new Function("module", "exports", result.outputFiles[0].text)(
    loadedModule,
    loadedModule.exports
  )
  const url =
    "http://newsletter.test/api/newsletter/confirm?token=fixture&lang=ar"
  const response = await loadedModule.exports.newsletterTokenPage(
    new Request(url),
    "site.newsletter.confirm"
  )
  const body = await response.text()
  let submittedOrigin: string | undefined
  let submittedUrl = ""
  await page.route("http://newsletter.test/**", async (route) => {
    if (route.request().method() === "POST") {
      submittedOrigin = route.request().headers().origin
      submittedUrl = route.request().url()
      await route.fulfill({
        status: submittedOrigin === "http://newsletter.test" ? 200 : 403,
        body: "Confirmed",
      })
    } else {
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body,
      })
    }
  })
  await page.goto(url)
  await page.getByRole("button", { name: "Confirm" }).click()
  await expect(page.locator("body")).toHaveText("Confirmed")
  expect(submittedOrigin).toBe("http://newsletter.test")
  expect(new URL(submittedUrl).searchParams.get("token")).toBe("fixture")
  expect(new URL(submittedUrl).searchParams.get("lang")).toBe("ar")
})
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [
      fileURLToPath(new URL("./fixtures/plugins.fixture.tsx", import.meta.url)),
    ],
    bundle: true,
    write: false,
    jsx: "automatic",
    platform: "browser",
    format: "iife",
    globalName: "PluginFixture",
    plugins: [
      {
        name: "plugin-actions",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(next\/link|.*(?:fact-review-action|newsletter-query|\/actions))$/,
            },
            (args) => ({ path: args.path, namespace: "fixture" })
          )
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            loader: "js",
            resolveDir: process.cwd(),
            contents:
              args.path === "next/link"
                ? "import React from 'react';export default p=>React.createElement('a',p,p.children)"
                : `const call=async(op,data)=>{const response=await fetch('/fixture/'+op,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return response.json()};export const searchFactPosts=()=>call('posts',{});export const loadFactReview=id=>call('load',{id});export const saveFactReviewAction=data=>call('save',data);export const savePluginConfigAction=(slug,config)=>call('config',{slug,config});export const deleteSubscriberAction=()=>Promise.resolve({success:true});export const getSubscriberPage=()=>Promise.resolve({items:[],total:0,error:''});`,
          }))
        },
      },
    ],
  })
  bundle = result.outputFiles[0].text
})
async function setup(page: Page, kind: string, locale: "en" | "ar" = "en") {
  page.on("pageerror", (error) =>
    console.error("Plugin fixture:", error.message)
  )
  let current: Record<string, unknown> | null = null,
    saved: Record<string, unknown> | null = null,
    conflict = false
  const data = () => ({
    postId: "1",
    title: "Article",
    sourceHash: "a".repeat(64),
    current,
    history: current ? [current] : [],
  })
  await page.route("http://plugins.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="fixture"></div>',
    })
  )
  await page.route("**/fixture/**", async (route) => {
    const op = route.request().url().split("/").pop(),
      input = route.request().postDataJSON()
    if (op === "posts")
      return route.fulfill({ json: [{ id: "1", title: "Article" }] })
    if (op === "load") return route.fulfill({ json: data() })
    if (op === "config") {
      saved = input
      return route.fulfill({ json: { success: true } })
    }
    if (op === "save") {
      const valid = factReviewSchema.safeParse(input)
      if (!valid.success)
        return route.fulfill({
          json: { success: false, error: "admin.plugins.invalid_config" },
        })
      if (conflict)
        return route.fulfill({
          json: { success: false, error: "admin.plugins.fact.source_changed" },
        })
      current = {
        ...input,
        version: 1,
        reviewerName: "Reviewer",
        reviewerId: "editor",
        reviewedAt: "2026-11-10T00:00:00.000Z",
        approved: input.approve,
      }
      saved = input
      return route.fulfill({ json: { success: true } })
    }
    return route.fulfill({ json: {} })
  })
  await page.route("**/api/newsletter/subscribe", async (route) => {
    saved = route.request().postDataJSON()
    return route.fulfill({
      json: { success: true, messageKey: "site.newsletter.check_email" },
    })
  })
  await page.goto("http://plugins.test")
  await page.addScriptTag({ content: bundle })
  await page.evaluate(
    ({ dict, locale, kind }) =>
      (
        window as unknown as {
          PluginFixture: typeof import("./fixtures/plugins.fixture")
        }
      ).PluginFixture.mount(dict, locale, kind),
    { dict: locale === "ar" ? ar : en, locale, kind }
  )
  return {
    saved: () => saved,
    setConflict: () => {
      conflict = true
    },
  }
}
test("fact review requires explicit approval and exposes history only after a successful save", async ({
  page,
}) => {
  const state = await setup(page, "fact-check")
  await page
    .getByLabel(en["admin.plugins.fact.post"], { exact: true })
    .selectOption("1")
  await page
    .getByLabel(en["admin.plugins.fact.claim"], { exact: true })
    .fill("A specific claim")
  await page
    .getByLabel(en["admin.plugins.fact.summary"], { exact: true })
    .fill("Evidence and reasoning")
  await page
    .getByLabel(en["admin.plugins.fact.sources"], { exact: true })
    .fill("https://example.org/evidence")
  await page
    .getByLabel(en["admin.plugins.fact.status"], { exact: true })
    .selectOption("supported")
  await page
    .getByRole("button", {
      name: en["admin.plugins.save_settings"],
      exact: true,
    })
    .click()
  await expect(page.getByRole("alert")).toHaveText(
    en["admin.plugins.invalid_config"]
  )
  expect(state.saved()).toBeNull()
  await page
    .getByLabel(en["admin.plugins.fact.approve"], { exact: true })
    .check()
  await page
    .getByRole("button", {
      name: en["admin.plugins.save_settings"],
      exact: true,
    })
    .click()
  await expect(page.locator("summary")).toContainText("(1)")
  expect(state.saved()?.approve).toBe(true)
})
test("Arabic review retains entered evidence when the source changed", async ({
  page,
}) => {
  const state = await setup(page, "fact-check", "ar")
  state.setConflict()
  await page
    .getByLabel(ar["admin.plugins.fact.post"], { exact: true })
    .selectOption("1")
  await page
    .getByLabel(ar["admin.plugins.fact.claim"], { exact: true })
    .fill("ادعاء يحتاج إلى مراجعة")
  await page
    .getByRole("button", {
      name: ar["admin.plugins.save_settings"],
      exact: true,
    })
    .click()
  await expect(page.getByRole("alert")).toHaveText(
    ar["admin.plugins.fact.source_changed"]
  )
  await expect(
    page.getByLabel(ar["admin.plugins.fact.claim"], { exact: true })
  ).toHaveValue("ادعاء يحتاج إلى مراجعة")
})
test("related post controls submit the chosen matching and display settings", async ({
  page,
}) => {
  const state = await setup(page, "related-posts")
  await page
    .getByLabel(en["admin.plugins.field.count"], { exact: true })
    .fill("6")
  await page
    .getByLabel(en["admin.plugins.field.matchStrategy"], { exact: true })
    .selectOption("tags")
  await page
    .getByLabel(en["admin.plugins.field.showThumbnail"], { exact: true })
    .uncheck()
  await page
    .getByRole("button", {
      name: en["admin.plugins.save_settings"],
      exact: true,
    })
    .click()
  await expect(page.getByRole("status")).toBeVisible()
  expect(state.saved()?.config).toMatchObject({
    count: 6,
    matchStrategy: "tags",
    showThumbnail: false,
  })
})
for (const locale of ["en", "ar"] as const)
  test(`newsletter requests confirmation in ${locale}`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en,
      state = await setup(page, "signup", locale)
    await page
      .getByPlaceholder(dict["site.newsletter.email"], { exact: true })
      .fill("reader@example.org")
    await page
      .getByRole("button", {
        name: dict["site.newsletter.subscribe"],
        exact: true,
      })
      .click()
    await expect(
      page.getByText(dict["site.newsletter.check_email"], { exact: true })
    ).toBeVisible()
    expect(state.saved()).toMatchObject({ email: "reader@example.org", locale })
  })

test("ad HTML does not execute in the browser without relying on CSP", async ({
  page,
}) => {
  const markup = sanitizePluginMarkup(
    '<script>window.__pluginXss=true</script><svg onload="window.__pluginXss=true"></svg><img src=x onerror="window.__pluginXss=true"><a href="javascript:window.__pluginXss=true" target="_blank">Unsafe</a><a href="/sponsor" target="_blank">Sponsor</a>'
  )
  await page.setContent("<main>" + markup + "</main>")
  await page.getByText("Unsafe", { exact: true }).click()
  expect(
    await page.evaluate(
      () => (window as unknown as { __pluginXss?: boolean }).__pluginXss
    )
  ).toBeUndefined()
  await expect(
    page.locator("script,svg,[onerror],a[href^='javascript:']")
  ).toHaveCount(0)
  await expect(page.getByText("Sponsor", { exact: true })).toHaveAttribute(
    "rel",
    "sponsored noopener noreferrer"
  )
})
