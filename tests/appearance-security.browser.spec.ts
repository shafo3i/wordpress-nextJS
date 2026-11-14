import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
async function bundle() {
  return build({
    entryPoints: [
      fileURLToPath(
        new URL("./fixtures/appearance-security.fixture.tsx", import.meta.url)
      ),
    ],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    globalName: "AppearanceFixture",
    plugins: [
      {
        name: "preview-template-fixture",
        setup(build) {
          build.onResolve({ filter: /^next\/image$/ }, () => ({
            path: "image",
            namespace: "fixture",
          }))
          build.onLoad({ filter: /^image$/, namespace: "fixture" }, () => ({
            contents: `import {createElement} from "react";export default function Image(props){return createElement("img",props)}`,
            loader: "js",
            resolveDir: fileURLToPath(new URL("..", import.meta.url)),
          }))
          build.onResolve(
            {
              filter:
                /^@\/components\/site\/templates\/(news-home|post-template|category-template)$/,
            },
            () => ({ path: "templates", namespace: "fixture" })
          )
          build.onLoad({ filter: /^templates$/, namespace: "fixture" }, () => ({
            contents: `import {createElement} from 'react';export function NewsHome({theme}){return createElement('output',{id:'preview-title'},theme.siteTitle)};export const PostTemplate=NewsHome;export const CategoryTemplate=NewsHome;`,
            loader: "js",
            resolveDir: fileURLToPath(new URL("..", import.meta.url)),
          }))
        },
      },
    ],
  })
}
for (const locale of ["en", "ar"] as const)
  test(`stored widget HTML is inert in ${locale}`, async ({ page }) => {
    const output = await bundle()
    await page.route("http://appearance.test/", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="fixture"></div>',
      })
    )
    await page.goto("http://appearance.test/")
    await page.addScriptTag({ content: output.outputFiles[0].text })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            AppearanceFixture: {
              render: (mode: string, locale: string) => void
            }
          }
        ).AppearanceFixture.render("html", locale),
      locale
    )
    await expect(page.getByText("Safe content", { exact: true })).toHaveCount(2)
    await expect(page.locator("#fixture script,#fixture iframe")).toHaveCount(0)
    expect(
      await page.evaluate(
        () => (window as unknown as { securityHit?: number }).securityHit
      )
    ).toBeUndefined()
  })
test("Customizer validates messages as well as origin and parent window", async ({
  page,
}) => {
  const output = await bundle()
  await page.route("http://appearance.test/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<div id="fixture"></div><iframe id="other"></iframe>',
    })
  )
  await page.goto("http://appearance.test/")
  await page.addScriptTag({ content: output.outputFiles[0].text })
  await page.evaluate(() =>
    (
      window as unknown as {
        AppearanceFixture: { render: (mode: string, locale: string) => void }
      }
    ).AppearanceFixture.render("preview", "en")
  )
  await expect(page.locator("#preview-title")).toHaveText("Initial")
  await page.evaluate(() => {
    for (const [origin, source] of [
      ["https://evil.test", window.parent],
      [
        window.location.origin,
        (document.getElementById("other") as HTMLIFrameElement).contentWindow,
      ],
    ] as const) {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin,
          source,
          data: {
            type: "customizer:state",
            state: {
              mods: {},
              siteTitle: "Attacker",
              siteTagline: "",
              page: "home",
            },
          },
        })
      )
    }
  })
  await expect(page.locator("#preview-title")).toHaveText("Initial")
  await page.evaluate(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        source: window.parent,
        data: {
          type: "customizer:state",
          state: {
            mods: {
              customCss: "</style><script>window.securityHit=1</script>",
            },
            siteTitle: "Accepted",
            siteTagline: "",
            page: "home",
          },
        },
      })
    )
  )
  await expect(page.locator("#preview-title")).toHaveText("Accepted")
  await page.evaluate(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: window.location.origin,
        source: window.parent,
        data: {
          type: "customizer:state",
          state: { mods: {}, siteTitle: 123, page: "home" },
        },
      })
    )
  )
  await expect(page.locator("#preview-title")).toHaveText("Accepted")
  expect(
    await page.evaluate(
      () => (window as unknown as { securityHit?: number }).securityHit
    )
  ).toBeUndefined()
})
