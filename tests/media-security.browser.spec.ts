import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import en from "../templates/language/en.json" with { type: "json" };
import ar from "../templates/language/ar.json" with { type: "json" };
let bundle: string;
test.beforeAll(async () => {
  const result = await build({ entryPoints: [fileURLToPath(new URL("./fixtures/media-security.fixture.tsx", import.meta.url))], bundle: true, write: false, jsx: "automatic", platform: "browser", format: "iife", globalName: "MediaSecurityFixture", plugins: [{ name: "isolated-media-actions", setup(builder) {
    builder.onResolve({ filter: /^(next\/navigation|\.\.\/actions)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ loader: "js", resolveDir: process.cwd(), contents: args.path === "next/navigation" ? "export const useSearchParams=()=>new URLSearchParams()" : "const call=async(op,data)=>{const response=await fetch('/fixture/'+op,{method:'POST',body:JSON.stringify(data)});return response.json()};export const updateMediaAction=(id,data)=>call('save',{id,...data});export const fetchMediaItemsAction=params=>call('list',params);export const uploadMediaAction=async()=>({success:false});export const deleteMediaAction=async()=>({success:false});" }));
  } }] }); bundle = result.outputFiles[0].text;
});
async function setup(page: Page, dict: Record<string, string>, kind = "modal") {
  await page.route("http://media.test/", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }));
  await page.goto("http://media.test/"); await page.addScriptTag({ content: bundle });
  await page.evaluate(({ dict, kind }) => (window as unknown as { MediaSecurityFixture: { mount: (dict: Record<string, string>, kind: string) => void } }).MediaSecurityFixture.mount(dict, kind), { dict, kind });
}
for (const [locale, dict] of [["en", en], ["ar", ar]] as const) test(`${locale}: attachment edits report failures and block unsafe links`, async ({ page }) => {
  await page.route("**/fixture/save", route => route.fulfill({ json: { success: false, error: dict["admin.media.error_failed"] } }));
  await setup(page, dict);
  const modal = page.getByRole("dialog"); await expect(modal).toBeVisible();
  await expect(modal.locator('a[href^="javascript:"], img[src="x"]')).toHaveCount(0);
  await modal.locator('input[type="text"]').nth(1).fill("Updated title");
  await modal.getByText(dict["admin.media.details_title"], { exact: true }).click();
  await expect(modal.getByRole("alert")).toHaveText(dict["admin.media.error_failed"]);
  await expect(page.locator("output")).toHaveAttribute("data-updates", "0");
  await page.route("**/fixture/save", route => route.fulfill({ json: { success: true } }));
  await modal.locator('input[type="text"]').nth(1).fill("Saved title");
  await modal.getByText(dict["admin.media.details_title"], { exact: true }).click();
  await expect(page.locator("output")).toHaveAttribute("data-updates", "1");
  page.on("dialog", dialog => dialog.accept());
  await modal.getByRole("button", { name: dict["admin.media.delete_permanently"], exact: true }).click();
  await expect(modal).toBeVisible(); await expect(page.locator("#fixture")).not.toHaveAttribute("data-closed", "true");
});
test("late media search responses do not replace the current filter results", async ({ page }) => {
  let release: (() => void) | undefined, oldFinished = false;
  await page.route("**/fixture/list", async route => {
    const { search } = route.request().postDataJSON();
    if (search === "old") { await new Promise<void>(resolve => { release = resolve; }); }
    const title = search === "new" ? "Current result" : search === "old" ? "Stale result" : "Initial result";
    await route.fulfill({ json: { success: true, data: { items: [{ id: 1, title, mimeType: "application/pdf", url: "/uploads/file.pdf", thumbnailUrl: "", filename: "file.pdf", uploadedAt: "2026-11-01T00:00:00Z", sizeBytes: 1, altText: "", caption: "", description: "", authorName: "Editor" }], total: 1, totalPages: 1, currentPage: 1, availableMonths: [] } } });
    if (search === "old") oldFinished = true;
  });
  await setup(page, en, "library"); await page.getByRole("button", { name: en["admin.media.list_view"], exact: true }).click(); await expect(page.getByText("Initial result", { exact: true })).toBeVisible();
  const search = page.getByPlaceholder(en["admin.media.search_placeholder"]); await search.fill("old");
  await expect.poll(() => !!release).toBe(true); await search.fill("new");
  await expect(page.getByText("Current result", { exact: true })).toBeVisible(); release!();
  await expect.poll(() => oldFinished).toBe(true);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(page.getByText("Stale result", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Current result", { exact: true })).toBeVisible();
});
