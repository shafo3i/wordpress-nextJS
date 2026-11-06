import { describe, expect, it } from "vitest"
import { isAutomatedVisitor, visitorToken } from "./post-view-token"

describe("anonymous view identity", () => {
  it("preserves valid signed visitors and replaces forged tokens", () => {
    const secret = "test-only-secret"
    const first = visitorToken(secret)
    expect(visitorToken(secret, first.token)).toMatchObject({
      id: first.id,
      fresh: false,
    })
    expect(visitorToken("different", first.token).fresh).toBe(true)
    expect(visitorToken(secret, "invalid").fresh).toBe(true)
  })
  it("excludes bots, previews and automated browser checks", () => {
    for (const agent of [
      "Googlebot/2.1",
      "HeadlessChrome",
      "Preview crawler",
      "",
    ])
      expect(isAutomatedVisitor(agent)).toBe(true)
    expect(isAutomatedVisitor("Mozilla/5.0 Chrome/130 Safari/537.36")).toBe(
      false
    )
  })
})
