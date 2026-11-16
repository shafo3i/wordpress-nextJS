import { test, expect } from "@playwright/test"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import nextConfig from "../next.config"
import { build } from "esbuild"

test("CSP diagnostics report inline scripts without blocking scripts or previews", async ({ page }) => {
  const rules = await nextConfig.headers!()
  const headers = Object.fromEntries(rules.find((rule) => rule.source === "/:path*")!.headers.map(({ key, value }) => [key, value]))
  const reports: string[] = []
  const server = createServer((request, response) => {
    if (request.url === "/api/security/csp-report") {
      let body = ""
      request.on("data", (chunk) => { body += chunk })
      request.on("end", () => { reports.push(body); response.writeHead(204).end() })
      return
    }
    if (request.url === "/fixture.js") {
      response.writeHead(200, { "Content-Type": "text/javascript" }).end("window.externalScriptRan=true")
      return
    }
    response.writeHead(200, { ...headers, "Content-Type": "text/html" })
    response.end(request.url === "/preview"
      ? "<!doctype html><p>Preview ready</p>"
      : '<!doctype html><script src="/fixture.js"></script><script>window.inlineScriptRan=true</script><iframe title="Preview" src="/preview"></iframe>')
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  try {
    await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`)
    expect(await page.evaluate(() => (window as unknown as { inlineScriptRan: boolean }).inlineScriptRan)).toBe(true)
    expect(await page.evaluate(() => (window as unknown as { externalScriptRan: boolean }).externalScriptRan)).toBe(true)
    await expect(page.frameLocator('iframe[title="Preview"]').getByText("Preview ready")).toBeVisible()
    await expect.poll(() => reports.some((body) => {
      const report = JSON.parse(body)["csp-report"]
      return report["effective-directive"] === "script-src-elem" && report["blocked-uri"] === "inline" && report.disposition === "report"
    })).toBe(true)
  } finally {
    await page.goto("about:blank")
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test("client validation works under an enforced no-eval CSP without violations", async ({ page }) => {
  const result = await build({
    stdin: { resolveDir: process.cwd(), contents: `
      import './instrumentation-client';
      import { z } from 'zod';
      import { postEditorSnapshotSchema } from './db/schema/cms-post-autosave';
      import { editorSnapshot } from './tests/fixtures/post-autosave';
      window.validationFixture = {
        jitless: z.config().jitless,
        valid: postEditorSnapshotSchema.safeParse(editorSnapshot()).success,
        invalid: postEditorSnapshotSchema.safeParse({...editorSnapshot(), authorId:'another-account'}).success,
      };
    ` }, bundle: true, write: false, platform: "browser", format: "iife",
  })
  await page.addInitScript(() => {
    const events: string[] = []
    Object.assign(window, { validationViolations: events })
    document.addEventListener("securitypolicyviolation", (event) => events.push(event.effectiveDirective))
  })
  await page.route("http://validation.test/", (route) => route.fulfill({
    contentType: "text/html", headers: { "Content-Security-Policy": "default-src 'none'; script-src 'self'" },
    body: '<!doctype html><script src="/validation.js"></script>',
  }))
  await page.route("http://validation.test/validation.js", (route) => route.fulfill({ contentType: "text/javascript", body: result.outputFiles[0].text }))
  await page.goto("http://validation.test/")
  expect(await page.evaluate(() => (window as unknown as { validationFixture: unknown }).validationFixture)).toEqual({ jitless: true, valid: true, invalid: false })
  expect(await page.evaluate(() => (window as unknown as { validationViolations: string[] }).validationViolations)).toEqual([])
})
