import { test, expect } from "@playwright/test"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"
import nextConfig from "../next.config"

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
