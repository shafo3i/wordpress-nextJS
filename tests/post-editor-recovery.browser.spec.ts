import { test, expect, type Page } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }

declare global {
  interface Window {
    PostEditorFixture: typeof import("./fixtures/post-editor.fixture")
  }
}
let bundle: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/post-editor.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "PostEditorFixture",
    plugins: [
      {
        name: "editor-fixture",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(next\/(dynamic|navigation|link)|@\/components\/admin\/media-select-modal|@\/app\/\(admin\)\/admincp\/(studio\/|media\/actions))/,
            },
            (args) => ({ path: args.path, namespace: "fixture" })
          )
          builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => {
            let contents = ""
            if (args.path === "next/dynamic")
              contents = `import React,{useEffect,useRef} from 'react';function Editor(p){const value=useRef(p.value);useEffect(()=>{value.current=p.value},[p.value]);useEffect(()=>{const cleanup=[];p.onInit?.({}, {getContent:()=>value.current,on:(event,fn)=>{if(event==='remove')cleanup.push(fn)}});return()=>cleanup.forEach(fn=>fn())},[]);return React.createElement('textarea',{id:'fake-tinymce',disabled:p.disabled,value:p.value,onChange:e=>{value.current=e.target.value;p.onEditorChange(e.target.value)}})}export default function dynamic(){return Editor}`
            else if (args.path === "next/navigation")
              contents =
                "export const useRouter=()=>({push:url=>{document.documentElement.dataset.destination=url},replace:()=>{},refresh:()=>{}});"
            else if (args.path === "next/link")
              contents =
                "import React from 'react';export default p=>React.createElement('a',p,p.children);"
            else if (args.path.includes("media/actions"))
              contents = "export const fetchMediaItemAction=async()=>({success:false});"
            else if (args.path.includes("media-select-modal"))
              contents = "export const MediaSelectModal=()=>null;"
            else
              contents =
                "export const createNewStudioPageAction=async()=>({pageId:'fixture'});export const switchPageEditorModeAction=async()=>{};"
            return { contents, loader: "js", resolveDir: process.cwd() }
          })
        },
      },
    ],
  })
  bundle = result.outputFiles[0].text
})

async function setup(page: Page) {
  page.on("pageerror", (error) =>
    console.error("Editor fixture error:", error.message)
  )
  await page.clock.install()
  page.on("dialog", (dialog) => dialog.accept())
  let active = true,
    limited = false,
    draftMode = false,
    account = "editor-a",
    writes = 0
  const records = new Map<string, unknown>()
  await page.route("http://editor.test/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="fixture"></div>',
    })
  )
  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(active ? { user: { id: account } } : null),
    })
  )
  await page.route("**/api/admin/posts/autosave**", async (route) => {
    if (!active)
      return route.fulfill({ status: 401, json: { error: "expired" } })
    const request = route.request()
    if (request.method() === "GET") {
      const key = new URL(request.url()).searchParams.get("documentKey")!
      return route.fulfill({
        json: { ownerId: account, record: records.get(key) || null },
      })
    }
    if (limited) return route.fulfill({ status: 429, headers: { "Retry-After": "60" }, json: { error: "admin.security.rate_limited" } })
    const packet = request.postDataJSON()
    if (packet.ownerId !== account)
      return route.fulfill({ status: 403, json: { error: "account_changed" } })
    const record = {
      documentKey: packet.documentKey,
      baseModified: draftMode ? "2026-11-09T12:01:00.000Z" : packet.baseModified,
      ...(draftMode ? { draftPostId: packet.documentKey.startsWith("new:") ? "2" : "1" } : {}),
      snapshot: packet.snapshot,
      savedAt: new Date().toISOString(),
      version: ++writes,
    }
    records.set(packet.documentKey, record)
    return route.fulfill({ json: { ownerId: account, record } })
  })
  const mount = async (locale: "en" | "ar" = "en", existing = true, status?: "draft" | "publish") => {
    draftMode = !existing || status === "draft"
    await page.goto("http://editor.test/")
    await page.addScriptTag({ content: bundle })
    const loaded = page.waitForResponse(
      (response) =>
        response.url().includes("/api/admin/posts/autosave") &&
        response.request().method() === "GET"
    )
    await page.evaluate(
      ({ locale, existing, status }) =>
        window.PostEditorFixture.render(locale, existing, status),
      { locale, existing, status }
    )
    await loaded
    await expect(page.locator("#fake-tinymce")).toBeVisible()
  }
  return {
    mount,
    records,
    limitAutosave: () => { limited = true },
    expire: () => {
      active = false
    },
    signIn: () => { active = true },
    changeAccount: () => {
      account = "editor-b"
    },
    writes: () => writes,
  }
}

for (const locale of ["en", "ar"] as const) {
  for (const intent of ["draft", "publish", "selected-publish"] as const) {
    test(`existing draft ${intent} keeps its edits and status after failure in ${locale}`, async ({ page }) => {
      const fixture = await setup(page)
      await fixture.mount(locale, true, "draft")
      const dict = locale === "ar" ? ar : en
      await page.locator("#fake-tinymce").fill("<p>Existing draft edits</p>")
      if (intent === "selected-publish") {
        await page.getByText(dict["admin.editor.status_draft"], { exact: true }).locator("..").locator("..").getByRole("button", { name: dict["common.edit"], exact: true }).click()
        await page.locator('select:has(option[value="publish"])').selectOption("publish")
        await page.getByRole("button", { name: dict["admin.common.confirm"], exact: true }).click()
      }
      await page.evaluate(() => window.PostEditorFixture.failSave(true))
      const button = page.getByRole("button", {
        name: dict[intent === "draft" ? "admin.editor.save_draft" : intent === "selected-publish" ? "admin.editor.update" : "admin.editor.publish"], exact: true,
      })
      await button.click()
      await expect(page.getByRole("alert").filter({ hasText: dict["admin.editor.save_failed"] })).toBeVisible()
      await expect(page.locator('input[type="hidden"][name="status"]')).toHaveValue(intent === "selected-publish" ? "publish" : "draft")
      await expect(page.locator("#fake-tinymce")).toHaveValue("<p>Existing draft edits</p>")
      await page.evaluate(() => window.PostEditorFixture.failSave(false))
      await button.click()
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.destination)).toBe("/admincp/posts")
      const saved = await page.evaluate(() => window.PostEditorFixture.saved())
      expect(saved.at(-1)?.status).toBe(intent === "draft" ? "draft" : "publish")
      expect(saved.at(-1)?.content).toContain("Existing draft edits")
    })
  }
}

for (const locale of ["en", "ar"] as const) {
  test(`new draft autosaves to the server and manual publish uses its latest version in ${locale}`, async ({ page }) => {
    const fixture = await setup(page)
    await fixture.mount(locale, false)
    const dict = locale === "ar" ? ar : en
    await page.locator('input[name="title"]').fill("Server draft")
    await page.locator("#fake-tinymce").fill("<p>Saved on the server</p>")
    await page.clock.runFor(31000)
    await expect(page.getByText(dict["admin.editor.autosave.server_draft_saved"], { exact: true })).toBeVisible()
    await expect(page.locator("time[datetime]")).toHaveCount(1)
    expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith("cms:post-recovery:")))).toBe(false)
    await page.getByRole("button", { name: dict["admin.editor.publish"], exact: true }).click()
    await expect.poll(() => page.evaluate(() => window.PostEditorFixture.saved().length)).toBe(1)
    const saved = await page.evaluate(() => window.PostEditorFixture.saved())
    expect(saved[0].expectedModifiedAt).toBe("2026-11-09T12:01:00.000Z")
    expect(saved[0].autosaveVersion).toBe("1")
    expect(saved[0].status).toBe("publish")
  })
}

test("post edits recover after reload, include SEO, and survive failed manual saves", async ({
  page,
}) => {
  const fixture = await setup(page)
  await fixture.mount()
  await page.locator('input[name="title"]').fill("Recovered title")
  await page.locator("#fake-tinymce").fill("<p>Recovered body</p>")
  await page.locator("#post-seo-title").fill("Recovered SEO")
  await page.clock.runFor(1100)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(localStorage).filter((key) =>
            key.startsWith("cms:post-recovery:")
          ).length
      )
    )
    .toBe(0)
  await page.clock.runFor(31000)
  await expect.poll(fixture.writes).toBeGreaterThan(0)
  expect(
    (fixture.records.get("post:1") as { snapshot: { content: string } })
      .snapshot.content
  ).toContain("Recovered body")
  await fixture.mount()
  await page
    .getByRole("button", {
      name: en["admin.editor.autosave.restore"],
      exact: true,
    })
    .click()
  await expect(page.locator('input[name="title"]')).toHaveValue(
    "Recovered title"
  )
  await expect(page.locator("#fake-tinymce")).toHaveValue(
    "<p>Recovered body</p>"
  )
  await expect(page.locator("#post-seo-title")).toHaveValue("Recovered SEO")
  await page.evaluate(() => window.PostEditorFixture.failSave(true))
  await page
    .getByRole("button", { name: en["admin.editor.update"], exact: true })
    .click()
  await expect(
    page.getByRole("alert").filter({ hasText: en["admin.editor.save_failed"] })
  ).toBeVisible()
  await expect(page.locator("#fake-tinymce")).toHaveValue(
    "<p>Recovered body</p>"
  )
  await page.evaluate(() => window.PostEditorFixture.failSave(false))
  await page
    .getByRole("button", { name: en["admin.editor.update"], exact: true })
    .click()
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.destination)
    )
    .toBe("/admincp/posts")
  const saved = await page.evaluate(() => window.PostEditorFixture.saved())
  expect(saved[0].content).toContain("Recovered body")
  expect(saved[0].postPassword).toBe("existing-password")
  expect(saved[0].commentStatus).toBe("closed")
})

test("new Arabic post survives expired session without invoking the manual save", async ({
  page,
}) => {
  const fixture = await setup(page)
  await fixture.mount("ar", false)
  await page.locator('input[name="title"]').fill("Arabic draft")
  await page.locator("#fake-tinymce").fill("<p>Draft retained</p>")
  await page.clock.runFor(1100)
  fixture.expire()
  await page
    .getByRole("button", { name: ar["admin.editor.publish"], exact: true })
    .click()
  await expect(
    page.getByText(ar["admin.editor.autosave.expired"], { exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(() => window.PostEditorFixture.saved().length)
  ).toBe(0)
  await expect(page.locator("#fake-tinymce")).toHaveValue(
    "<p>Draft retained</p>"
  )
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith("cms:post-recovery:")))).toBe(false)
  fixture.signIn()
  await page.getByRole("button", { name: ar["admin.editor.publish"], exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.PostEditorFixture.saved().length)).toBe(1)
})

test("account switches block uploading another account's draft", async ({
  page,
}) => {
  const fixture = await setup(page)
  await fixture.mount()
  await page.locator("#fake-tinymce").fill("Account A private edits")
  fixture.changeAccount()
  await page.clock.runFor(31000)
  await expect(
    page.getByText(en["admin.editor.autosave.account_changed"], { exact: true })
  ).toBeVisible()
  expect(fixture.writes()).toBe(0)
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((key) => key.includes("editor-a"))
    )
  ).toBe(false)
})

test("share destinations can be toggled and copying reports actual success", async ({
  page,
}) => {
  await page.goto("about:blank")
  await page.addScriptTag({ content: bundle })
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="fixture"></div>'
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.body.dataset.copied = text
        },
      },
    })
    window.PostEditorFixture.shares("en")
  })
  await expect(
    page.getByRole("link", { name: en["site.share.facebook"], exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: en["site.share.whatsapp"], exact: true })
  ).toHaveAttribute("href", /wa.me/)
  for (const link of await page.locator('a[title]').all()) {
    await expect(link.locator('svg')).toHaveCount(1)
    expect(await link.innerText()).toBe("")
  }

  await page
    .getByRole("button", { name: en["site.copy_link"], exact: true })
    .click()
  await expect(page.locator('[role="status"]')).toHaveText(
    en["site.share.copied"]
  )
  expect(await page.evaluate(() => document.body.dataset.copied)).toBe(
    "https://site.test/en/posts/story"
  )
  await page.evaluate(() => window.PostEditorFixture.shares("en", false))
  await expect(
    page.getByRole("link", { name: en["site.share.facebook"], exact: true })
  ).toHaveCount(0)
})

for (const locale of ["en", "ar"] as const) {
  test(`rate limiting preserves ${locale} editor content and recovery`, async ({ page }) => {
    const fixture = await setup(page)
    await fixture.mount(locale)
    const dict = locale === "ar" ? ar : en
    await page.locator('input[name="title"]').fill(`Retained ${locale} title`)
    await page.locator("#fake-tinymce").fill("<p>Retained unsaved body</p>")
    await page.clock.runFor(1100)
    await page.evaluate(() => window.PostEditorFixture.limitSave())
    await page.getByRole("button", { name: dict["admin.editor.update"], exact: true }).click()
    await expect(page.getByRole("alert").filter({ hasText: dict["admin.security.rate_limited"] })).toBeVisible()
    await expect(page.locator('input[name="title"]')).toHaveValue(`Retained ${locale} title`)
    await expect(page.locator("#fake-tinymce")).toHaveValue("<p>Retained unsaved body</p>")
    expect(await page.evaluate(() => window.PostEditorFixture.saved().length)).toBe(0)
    expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith("cms:post-recovery:")))).toBe(false)
    fixture.limitAutosave()
    await page.clock.runFor(31000)
    await expect(page.locator('input[name="title"]')).toHaveValue(`Retained ${locale} title`)
    expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith("cms:post-recovery:")))).toBe(false)
  })
}
