import { test, expect } from "@playwright/test"
import { build } from "esbuild"
import { fileURLToPath } from "node:url"
import en from "../templates/language/en.json" with { type: "json" }
import ar from "../templates/language/ar.json" with { type: "json" }

for (const locale of ["en", "ar"] as const)
  test(`storage scans require an explicit click in ${locale}`, async ({
    page,
  }) => {
    const dict = locale === "ar" ? ar : en
    const bundle = await build({
      entryPoints: [
        fileURLToPath(
          new URL("./fixtures/storage-manual.fixture.tsx", import.meta.url)
        ),
      ],
      bundle: true,
      write: false,
      platform: "browser",
      jsx: "automatic",
      format: "iife",
      globalName: "StorageFixture",
      plugins: [
        {
          name: "isolated-storage-actions",
          setup(builder) {
            builder.onResolve({ filter: /^next\/link$/ }, () => ({
              path: "link",
              namespace: "fixture-link",
            }))
            builder.onLoad({ filter: /.*/, namespace: "fixture-link" }, () => ({
              contents:
                'import {createElement} from "react"; export default function Link(props){return createElement("a",props,props.children)}',
              loader: "js",
              resolveDir: process.cwd(),
            }))
            builder.onResolve({ filter: /^\.\.\/actions$/ }, (args) => ({
              path: args.importer.includes("site-health") ? "health" : "media",
              namespace: "actions",
            }))
            builder.onLoad({ filter: /.*/, namespace: "actions" }, () => ({
              contents: `
      export async function fetchSiteHealthAction(){globalThis.storageCalls.health++;return {success:true,data:globalThis.storageHealth}}
      export async function scanSiteStorageAction(){globalThis.storageCalls.scanHealth++; if(globalThis.failStorage)return {success:false,error:globalThis.storageError};return {success:true,data:{...globalThis.storageHealth,storage:{...globalThis.storageHealth.storage,fileCount:42,totalSize:'1 MB',scannedAt:'2026-11-15T12:00:00.000Z'}}}}
      export async function getMediaStatsAction(){globalThis.storageCalls.scanMedia++;return {success:true,stats:{...globalThis.storageStats,physicalFilesCount:42,totalDiskUsageBytes:1048576,scannedAt:'2026-11-15T12:00:00.000Z'}}}
      export async function regenerateThumbnailsAction(){globalThis.storageCalls.regenerate++;return {success:true,data:{processed:1,totalSizesGenerated:1,details:[]}}}
      export async function scanOrphanMediaAction(){globalThis.storageCalls.orphans++;return {success:true,data:{totalFiles:42,inUseCount:42,orphanCount:0,reclaimableBytes:0,orphanFiles:[]}}}
      export const cleanOrphanMediaAction=async()=>({success:false});`,
              loader: "js",
            }))
          },
        },
      ],
    })
    await page.route("**/*", (route) =>
      route.request().url() === "http://storage.test/"
        ? route.fulfill({
            contentType: "text/html",
            body: '<div id="fixture"></div>',
          })
        : route.abort()
    )
    await page.goto("http://storage.test/")
    await page.addScriptTag({ content: bundle.outputFiles[0].text })
    await page.evaluate(
      (value) =>
        (
          window as unknown as {
            StorageFixture: { render(value: string): void }
          }
        ).StorageFixture.render(value),
      locale
    )
    const health = page.locator("[data-health]"),
      media = page.locator("[data-media]")
    await expect(
      health.getByText(dict["admin.tools.storage.not_scanned"])
    ).toBeVisible()
    const calls = () =>
      page.evaluate(
        () =>
          (globalThis as unknown as { storageCalls: Record<string, number> })
            .storageCalls
      )
    expect(await calls()).toEqual({
      health: 0,
      scanHealth: 0,
      scanMedia: 0,
      regenerate: 0,
      orphans: 0,
    })
    await health
      .getByRole("button", {
        name: dict["admin.tools.recheck_status"],
        exact: true,
      })
      .click()
    await expect.poll(async () => (await calls()).health).toBe(1)
    expect((await calls()).scanHealth).toBe(0)
    await page.evaluate(() => Object.assign(globalThis, { failStorage: true }))
    await health
      .getByRole("button", {
        name: dict["admin.tools.storage.scan"],
        exact: true,
      })
      .click()
    await expect(health.getByRole("alert")).toHaveText(
      dict["admin.tools.error.failed"]
    )
    await page.evaluate(() => Object.assign(globalThis, { failStorage: false }))
    await health
      .getByRole("button", {
        name: dict["admin.tools.storage.scan"],
        exact: true,
      })
      .click()
    await expect(
      health.getByText(
        dict["admin.tools.storage.last_scan"].replace(
          "{time}",
          "2026-11-15T12:00:00.000Z"
        )
      )
    ).toBeVisible()
    await media
      .getByRole("button", {
        name: dict["admin.tools.storage.scan"],
        exact: true,
      })
      .click()
    await expect.poll(async () => (await calls()).scanMedia).toBe(1)
    await media
      .getByRole("button", {
        name: dict["admin.tools.media.btn_start_regen"],
        exact: true,
      })
      .click()
    await expect.poll(async () => (await calls()).regenerate).toBe(1)
    expect((await calls()).scanMedia).toBe(1)
    await media.getByRole("button", { name: dict["admin.tools.media.tab_orphans"], exact: true }).click()
    expect((await calls()).orphans).toBe(0)
    await media.getByRole("button", { name: dict["admin.tools.media.btn_scan_orphans"], exact: true }).click()
    await expect.poll(async () => (await calls()).orphans).toBe(1)
  })
