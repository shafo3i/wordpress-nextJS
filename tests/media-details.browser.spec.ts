import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/media-details.fixture.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "MediaFixture",
    plugins: [
      {
        name: "mock-actions",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^@\/(app\/\(admin\)\/admincp\/media\/actions|components\/admin\/media-select-modal)$/,
            },
            (args) => ({ path: args.path, namespace: "mock" })
          )
          builder.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents: args.path.includes("media-select")
              ? "export const MediaSelectModal=()=>null"
              : "export async function fetchMediaItemAction(){return {success:true,item:window.mediaItem}};export async function updateMediaAction(id,data){window.savedDetails=data;return {success:true,item:{...window.mediaItem,...data}}}",
            loader: "js",
          }))
        },
      },
    ],
  })
  bundle = result.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const)
  test(`attachment preview and editable fields (${locale})`, async ({
    page,
  }) => {
    const dict: Record<string, string> = locale === "ar" ? ar : en
    const item = {
      id: 28004,
      title: "Original title",
      url: "/uploads/photo.jpg",
      thumbnailUrl: "/uploads/missing-thumbnail.jpg",
      filename: "photo.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 0,
      width: 1536,
      height: 1024,
      altText: "Original alt",
      caption: "Original caption",
      description: "Original description",
      uploadedAt: "2026-11-09T12:00:00Z",
      authorName: "Editor",
    }
    await page.route("http://media.test/**", (route) =>
      route.request().url().endsWith("photo.jpg")
        ? route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>',
          })
        : route.request().url().includes("thumbnail")
          ? route.fulfill({ status: 404 })
          : route.fulfill({
              contentType: "text/html",
              body: '<div id="fixture"></div>',
            })
    )
    await page.goto("http://media.test/")
    await page.evaluate((item) => {
      Object.assign(window, { mediaItem: item })
    }, item)
    await page.addScriptTag({ content: bundle })
    await page.evaluate((locale) => {
      ;(
        window as unknown as {
          MediaFixture: { render: (locale: string, item: unknown) => void }
          mediaItem: unknown
        }
      ).MediaFixture.render(
        locale,
        (window as unknown as { mediaItem: unknown }).mediaItem
      )
    }, locale)
    await expect(
      page
        .getByRole("button", {
          name: dict["admin.editor.change_image"],
          exact: true,
        })
        .first()
        .locator("img")
    ).toHaveAttribute("src", "/uploads/photo.jpg")
    await expect(
      page.getByText(dict["admin.media.unknown"], { exact: true })
    ).toBeVisible()
    for (const [key, value] of [
      ["title_label", "New title"],
      ["alt_text", "New alt"],
      ["caption", "New caption"],
      ["description", "New description"],
    ])
      await page
        .getByLabel(dict[`admin.media.${key}`], { exact: true })
        .fill(value)
    await page
      .getByRole("button", {
        name: dict["admin.media.details_save"],
        exact: true,
      })
      .click()
    await expect(page.getByRole("status")).toHaveText(
      dict["admin.media.details_saved"]
    )
    expect(
      await page.evaluate(
        () => (window as unknown as { savedDetails: unknown }).savedDetails
      )
    ).toEqual({
      title: "New title",
      altText: "New alt",
      caption: "New caption",
      description: "New description",
    })
  })
