import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import en from "../templates/language/en.json" with { type: "json" };
import ar from "../templates/language/ar.json" with { type: "json" };
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL("./fixtures/comments-security.fixture.tsx", import.meta.url))],
    bundle: true, write: false, jsx: "automatic", platform: "browser", format: "iife", globalName: "CommentsFixture",
    plugins: [{ name: "isolated-comment-actions", setup(builder) {
      builder.onResolve({ filter: /^(next\/link|next\/navigation|\.\.\/action)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        loader: "js", resolveDir: process.cwd(),
        contents: args.path === "next/link"
          ? "import React from 'react';export default p=>React.createElement('a',p,p.children)"
          : args.path === "next/navigation"
            ? "export const useRouter=()=>({refresh(){},push(){}})"
            : "const call=async(ids,status)=>{const res=await fetch('/fixture/moderate',{method:'POST',body:JSON.stringify({ids,status})});if(!res.ok)throw Error('private database error');return res.json()};export const bulkUpdateCommentStatus=call;export const bulkDeleteComments=call;export const deleteCommentAction=async()=>{};export const updateCommentStatusAction=async()=>{};",
      }));
    } }],
  });
  bundle = result.outputFiles[0].text;
});
for (const [locale, dict] of [["en", en], ["ar", ar]] as const) {
  test(`${locale}: escapes imported comments and reports actual moderation counts`, async ({ page }) => {
    await page.route("http://comments.test/**", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }));
    await page.route("**/fixture/moderate", route => route.fulfill({ json: { success: true, count: 1 } }));
    await page.goto("http://comments.test/");
    await page.addScriptTag({ content: bundle });
    await page.evaluate(dict => (window as unknown as { CommentsFixture: { mount: (dict: Record<string, string>) => void } }).CommentsFixture.mount(dict), dict);
    await expect(page.locator("table img, table script")).toHaveCount(0);
    await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
    await page.getByRole("checkbox", { name: dict["admin.common.select_all"], exact: true }).first().check();
    await page.getByRole("combobox", { name: dict["admin.common.bulk_actions"], exact: true }).first().selectOption("spam");
    await page.getByRole("button", { name: dict["admin.common.apply"], exact: true }).first().click();
    await expect(page.getByText(`1 ${dict["admin.comments.bulk.spam_notice"]}`, { exact: true })).toBeVisible();
    await page.route("**/fixture/moderate", route => route.fulfill({ status: 500, json: {} }));
    await page.getByRole("checkbox", { name: dict["admin.common.select_all"], exact: true }).first().check();
    await page.getByRole("combobox", { name: dict["admin.common.bulk_actions"], exact: true }).first().selectOption("spam");
    await page.getByRole("button", { name: dict["admin.common.apply"], exact: true }).first().click();
    await expect(page.getByText(dict["admin.comments.error.failed"], { exact: true })).toBeVisible();
    await expect(page.getByText("private database error", { exact: true })).toHaveCount(0);
  });
}
