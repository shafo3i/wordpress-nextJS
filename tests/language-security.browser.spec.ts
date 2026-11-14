import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import en from "../templates/language/en.json" with { type: "json" };
import ar from "../templates/language/ar.json" with { type: "json" };
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL("./fixtures/language-security.fixture.tsx", import.meta.url))],
    bundle: true, write: false, jsx: "automatic", platform: "browser", format: "iife", globalName: "LanguageFixture",
    plugins: [{ name: "isolated-language-actions", setup(builder) {
      builder.onResolve({ filter: /^(next\/link|\.\.\/action)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        loader: "js", resolveDir: process.cwd(),
        contents: args.path === "next/link" ? "import React from 'react';export default p=>React.createElement('a',p,p.children)"
          : "const save=async form=>{await fetch('/fixture/save',{method:'POST',body:JSON.stringify(Object.fromEntries(form))})};export const createLanguageAction=save;export const updateLanguageAction=save;export const saveTranslationAction=save;export const deleteTranslationOverrideAction=save;",
      }));
    } }],
  });
  bundle = result.outputFiles[0].text;
});
for (const [locale, dict] of [["en", en], ["ar", ar]] as const) {
  test(`${locale}: unchecked languages and colliding translation keys submit correctly`, async ({ page }) => {
    const saved: Record<string, string>[] = [];
    await page.route("http://languages.test/**", route => route.fulfill({ contentType: "text/html", body: '<div id="fixture"></div>' }));
    await page.route("**/fixture/save", async route => { saved.push(route.request().postDataJSON()); await route.fulfill({ json: {} }); });
    await page.goto("http://languages.test/");
    await page.addScriptTag({ content: bundle });
    await page.evaluate(dict => (window as unknown as { LanguageFixture: { mount: (dict: Record<string, string>) => void } }).LanguageFixture.mount(dict), dict);
    await expect(page.locator("table img")).toHaveCount(0);
    const language = page.locator("form").filter({ has: page.locator('input[name="originalCode"]') });
    await language.locator('input[type="checkbox"][name="isActive"]').uncheck();
    await language.getByRole("button", { name: dict["admin.languages.form.save"], exact: true }).click();
    await expect.poll(() => saved[0]).toMatchObject({ originalCode: "de", isActive: "false", isDefault: "false" });
    await page.locator('#trans-1 input[name="value"]').fill('<svg onload="alert(1)">');
    await page.locator('button[form="trans-1"]').click();
    await expect.poll(() => saved[1]).toMatchObject({ key: "site_title", value: '<svg onload="alert(1)">' });
    await expect(page.locator("table svg[onload], table img")).toHaveCount(0);
  });
}
