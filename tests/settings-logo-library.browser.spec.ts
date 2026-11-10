import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/settings-logo-library.fixture.tsx"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    globalName: "LogoLibraryFixture",
    plugins: [
      {
        name: "logo-library-actions",
        setup(builder) {
          builder.onResolve(
            {
              filter:
                /^(next\/navigation|\.\.\/action|@\/app\/\(admin\)\/admincp\/media\/actions)$/,
            },
            (args) => ({ path: args.path, namespace: "mock" })
          )
          builder.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents:
              args.path === "next/navigation"
                ? "export const useRouter=()=>({refresh(){}})"
                : args.path === "../action"
                  ? "export async function selectSettingsLogoAction(id){window.selectedLogoId=id;return {success:true,logo:{id,url:window.mediaItem.url}}};export async function removeSettingsLogoAction(){return {success:true}}"
                  : "export async function fetchMediaItemsAction(){return {success:true,data:{items:[window.mediaItem],total:1,page:1,totalPages:1}}};export async function fetchMediaItemAction(){return {success:true,item:window.mediaItem}};export async function updateMediaAction(){return {success:true,item:window.mediaItem}};export async function uploadMediaAction(){throw new Error('Upload not expected')}",
            loader: "js",
          }))
        },
      },
    ],
  })
  bundle = result.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const)
  test(`select existing logo (${locale})`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en
    await page.route("http://logo.test/**", (route) =>
      route.request().url().endsWith("logo.png")
        ? route.fulfill({
            contentType: "image/svg+xml",
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"/>',
          })
        : route.fulfill({
            contentType: "text/html",
            body: '<div id="fixture"></div>',
          })
    )
    await page.goto("http://logo.test/")
    await page.evaluate(() => {
      Object.assign(window, {
        mediaItem: {
          id: 28004,
          title: "Existing logo",
          url: "/uploads/logo.png",
          thumbnailUrl: "/uploads/logo.png",
          filename: "logo.png",
          mimeType: "image/png",
          sizeBytes: 1000,
          width: 100,
          height: 30,
          altText: "Existing logo",
          caption: "",
          description: "",
          uploadedAt: "2026-11-09T12:00:00Z",
          authorName: "Editor",
        },
      })
    })
    await page.addScriptTag({ content: bundle })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            LogoLibraryFixture: { render: (locale: string) => void }
          }
        ).LogoLibraryFixture.render(locale),
      locale
    )
    await page
      .getByRole("button", {
        name: dict["admin.settings.logo.select_library"],
        exact: true,
      })
      .click()
    await page
      .getByRole("img", { name: "Existing logo", exact: true })
      .first()
      .click()
    await page
      .getByRole("button", {
        name: dict["admin.settings.logo.apply_selected"],
        exact: true,
      })
      .click()
    await expect(
      page.getByRole("img", {
        name: dict["admin.settings.logo.preview"],
        exact: true,
      })
    ).toHaveAttribute("src", "/uploads/logo.png")
    await expect(page.getByRole("status")).toHaveText(
      dict["admin.settings.logo.saved"]
    )
    expect(
      await page.evaluate(
        () => (window as unknown as { selectedLogoId: string }).selectedLogoId
      )
    ).toBe("28004")
    await expect(
      page.getByRole("button", {
        name: dict["admin.settings.logo.select_library"],
        exact: true,
      })
    ).toBeVisible()
  })
