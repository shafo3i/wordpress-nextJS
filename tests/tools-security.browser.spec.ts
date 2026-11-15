import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }
for (const locale of ["en", "ar"] as const)
  test(`Tools failures preserve fields and safe links in ${locale}`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en
    const bundle = await build({
      entryPoints: [
        fileURLToPath(
          new URL("./fixtures/tools-security.fixture.tsx", import.meta.url)
        ),
      ],
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      globalName: "ToolsFixture",
      plugins: [
        {
          name: "tool-actions",
          setup(builder) {
            builder.onResolve({ filter: /^\.\.\/actions$/ }, (args) => ({
              path: args.path,
              namespace: "actions",
            }))
            builder.onLoad({ filter: /.*/, namespace: "actions" }, () => ({
              contents: `const fail=async()=>({success:false,error:globalThis.toolsError});export const createRedirectAction=fail,deleteRedirectAction=fail,fetchRedirectsAction=fail,runSearchReplaceAction=fail;`,
              loader: "js",
            }))
          },
        },
      ],
    })
    await page.route("**/*", (route) =>
      route.fulfill(
        route.request().url() === "http://tools.test/"
          ? { contentType: "text/html", body: '<div id="fixture"></div>' }
          : { status: 500, contentType: "application/json", body: "{}" }
      )
    )
    await page.goto("http://tools.test/")
    await page.addScriptTag({ content: bundle.outputFiles[0].text })
    await page.evaluate(
      (locale) =>
        (
          window as unknown as {
            ToolsFixture: { render: (locale: "en" | "ar") => void }
          }
        ).ToolsFixture.render(locale),
      locale
    )
    const redirects = page.locator("[data-tools-redirect]")
    await expect(redirects.locator('a[href^="javascript:"]')).toHaveCount(0)
    page.on("dialog", (dialog) => dialog.accept())
    await redirects
      .getByRole("button", { name: dict["admin.common.delete"], exact: true })
      .click()
    await expect(redirects).toContainText(dict["admin.tools.error.failed"])
    await expect(redirects).toContainText("/old")
    const download = page.locator("[data-tools-export]")
    await download
      .getByRole("button", { name: dict["admin.tools.download_export_file"] })
      .click()
    await expect(download.getByRole("alert")).toHaveText(
      dict["admin.tools.error.failed"]
    )
    const search = page.locator("[data-tools-search]")
    await search
      .getByPlaceholder(dict["admin.tools.search_example"])
      .fill("old.test")
    await search
      .getByPlaceholder(dict["admin.tools.replace_example"])
      .fill("new.test")
    await search
      .getByRole("button", { name: dict["admin.tools.run_dry_run"] })
      .click()
    await expect(search).toContainText(dict["admin.tools.error.failed"])
    await expect(
      search.getByPlaceholder(dict["admin.tools.search_example"])
    ).toHaveValue("old.test")
  })
