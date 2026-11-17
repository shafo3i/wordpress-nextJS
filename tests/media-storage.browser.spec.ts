import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
let bundle: string
test.beforeAll(async () => {
  const result = await build({ entryPoints: ["tests/fixtures/media-storage.fixture.tsx"], bundle: true, write: false, platform: "browser", format: "iife", globalName: "StorageFixture", plugins: [{ name: "storage-actions", setup(builder) {
    builder.onResolve({ filter: /^(\.\.\/action|@\/app\/\(admin\)\/admincp\/media\/actions)$/ }, ({ path }) => ({ path, namespace: "fixture" }))
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ loader: "js", contents: path === "../action" ? `
      export const saveMediaStorageAction=async input=>{window.savedStorage=input;return {success:true,settings:{...input.settings,credentialsConfigured:true}}};
      export const testMediaStorageAction=async()=>({success:true});export const retryMediaStorageCleanupAction=async()=>({success:true,completed:1,failed:0});`
      : `export const fetchMediaItemsAction=async()=>({success:true,data:{items:[],total:0,totalPages:1,currentPage:1,availableMonths:[]}});
      export const fetchMediaItemAction=async()=>({success:false});export const updateMediaAction=async()=>({success:false});
      export const uploadMediaAction=async form=>{window.uploadDestination=form.get('destination');return {success:true,items:[{id:1,url:'https://media.example.test/file.png',mimeType:'image/png'}]}};` }))
  } }] })
  bundle = result.outputFiles[0].text
})
for (const locale of ["en", "ar"] as const) {
  test(`storage settings and uploader work in ${locale}`, async ({ page }) => {
    const dict = locale === "ar" ? ar : en
    await page.route("http://storage.test/", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }))
    await page.route("**/api/media/storage", route => route.fulfill({ json: { s3: true } }))
    await page.goto("http://storage.test/")
    await page.addScriptTag({ content: bundle })
    await page.evaluate(locale => (window as unknown as { StorageFixture: { mount: (locale: string) => void } }).StorageFixture.mount(locale), locale)
    await page.getByLabel(dict["admin.storage.enabled"], { exact: true }).check()
    for (const [field, value] of Object.entries({ endpoint: "https://s3.eu-central-1.wasabisys.com", region: "eu-central-1", bucket: "news-media", publicBaseUrl: "https://media.example.test" })) await page.locator(`#storage-${field}`).fill(value)
    await page.getByLabel(dict["admin.storage.access_key"], { exact: true }).fill("test-id")
    await page.getByLabel(dict["admin.storage.secret_key"], { exact: true }).fill("test-secret")
    await page.getByRole("button", { name: dict["admin.settings.save_changes"], exact: true }).click()
    await expect(page.getByRole("status")).toHaveText(dict["admin.storage.saved"])
    await expect(page.locator("#storage-secret-key")).toHaveValue("")
    await page.getByRole("button", { name: dict["admin.storage.test"], exact: true }).click()
    await expect(page.getByRole("status")).toHaveText(dict["admin.storage.test_success"])
    const picker = page.getByRole("dialog")
    await picker.getByRole("button", { name: dict["admin.menu.add_new_media"], exact: true }).click()
    const destination = picker.getByLabel(dict["admin.storage.destination"], { exact: true })
    await expect(destination).toHaveValue("local")
    await destination.selectOption("s3")
    await picker.locator('input[type="file"]').setInputFiles({ name: "image.png", mimeType: "image/png", buffer: Buffer.from("fixture") })
    await expect.poll(() => page.evaluate(() => (window as unknown as { uploadDestination: string }).uploadDestination)).toBe("s3")
  })
}
