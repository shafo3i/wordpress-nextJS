import { describe, expect, it } from "vitest"
import { getPostDateBounds } from "@/lib/post-date-filter"
import { postViewIdSchema } from "@/db/schema/cms-post-filters"

describe("post date filtering", () => {
  it("uses complete months with an exclusive next-month boundary", () => {
    const bounds = getPostDateBounds({ date: "2024-02" })
    expect(bounds.valid && bounds.start?.toISOString()).toBe(
      "2024-02-01T00:00:00.000Z"
    )
    expect(bounds.valid && bounds.end?.toISOString()).toBe(
      "2024-03-01T00:00:00.000Z"
    )
  })
  it("includes the complete end date and accepts open ranges", () => {
    const bounds = getPostDateBounds({
      date: "range",
      from: "2026-10-01",
      to: "2026-10-31",
    })
    expect(bounds.valid && bounds.end?.toISOString()).toBe(
      "2026-11-01T00:00:00.000Z"
    )
    expect(getPostDateBounds({ date: "range", to: "2026-10-31" }).valid).toBe(
      true
    )
  })
  it("rejects reversed ranges, invalid calendar days and malformed months", () => {
    for (const value of [
      { date: "2026-99" },
      { date: "range", from: "2026-02-30" },
      { date: "range", from: "2026-11-02", to: "2026-11-01" },
    ])
      expect(getPostDateBounds(value).valid).toBe(false)
  })
  it("retains bounded legacy today/month shortcuts", () => {
    const bounds = getPostDateBounds(
      { date: "today" },
      new Date("2026-11-06T17:00:00Z")
    )
    expect(bounds.valid && bounds.end?.toISOString()).toBe(
      "2026-11-07T00:00:00.000Z"
    )
  })
  it("safely rejects malformed and oversized tracking IDs", () => {
    for (const id of [
      "abc",
      "-1",
      "0",
      "1;DROP TABLE",
      "9999999999999999999999999999",
    ])
      expect(postViewIdSchema.safeParse(id).success).toBe(false)
  })
})
