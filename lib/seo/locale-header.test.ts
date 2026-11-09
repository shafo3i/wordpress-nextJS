import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "@/proxy"

describe("locale request headers", () => {
  it("rejects control characters and oversized/invalid hints without breaking the response", async () => {
    for (const hint of [
      "en\nx-injected: true",
      "x".repeat(10000),
      "../../private",
    ]) {
      const response = await proxy(
        new NextRequest(
          `http://localhost/api/check?${new URLSearchParams({ lang: hint })}`
        )
      )
      expect(response.headers.get("x-middleware-request-x-cms-locale")).toBe("")
    }
    const response = await proxy(
      new NextRequest("http://localhost/api/check?lang=en")
    )
    expect(response.headers.get("x-middleware-request-x-cms-locale")).toBe("en")
  })
})
