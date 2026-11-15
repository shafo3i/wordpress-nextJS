import { describe, expect, it } from "vitest"
import {
  redirectInputSchema,
  searchReplaceSchema,
  cleanupActionsSchema,
  exportFiltersSchema,
  mediaRegenerateSchema,
} from "@/db/schema/cms-tools"
describe("Tools input boundaries", () => {
  it.each([
    "javascript:alert(1)",
    "//evil.test",
    "/\\evil.test",
    "/x%0d%0aLocation:evil",
    "https://u:p@evil.test",
  ])("rejects dangerous redirect targets %s", (targetUrl) => {
    expect(
      redirectInputSchema.safeParse({ sourcePath: "/old", targetUrl }).success
    ).toBe(false)
  })
  it("accepts local/https redirects and bounds status codes", () => {
    expect(
      redirectInputSchema.parse({ sourcePath: "/old/", targetUrl: "/new" })
        .sourcePath
    ).toBe("/old")
    expect(
      redirectInputSchema.safeParse({
        sourcePath: "/old",
        targetUrl: "https://publication.test/new",
        statusCode: 307,
      }).success
    ).toBe(false)
  })
  it("rejects protected source paths", () => {
    expect(
      redirectInputSchema.safeParse({
        sourcePath: "/api/auth",
        targetUrl: "/other",
      }).success
    ).toBe(false)
  })
  it("defaults search-replace to dry-run and rejects unknown tables", () => {
    expect(
      searchReplaceSchema.parse({ search: "a", replace: "b" }).dryRun
    ).toBe(true)
    expect(
      searchReplaceSchema.safeParse({ search: "", replace: "b" }).success
    ).toBe(false)
    expect(
      searchReplaceSchema.safeParse({
        search: "a",
        replace: "b",
        tables: ["user"],
      }).success
    ).toBe(false)
  })
  it("bounds cleanup and thumbnail jobs", () => {
    expect(cleanupActionsSchema.safeParse(["drop_database"]).success).toBe(
      false
    )
    expect(
      mediaRegenerateSchema.safeParse({ attachmentIds: [-1] }).success
    ).toBe(false)
  })
  it("validates export format/date/category filters", () => {
    expect(exportFiltersSchema.safeParse({ format: "exe" }).success).toBe(false)
    expect(
      exportFiltersSchema.safeParse({ startDate: "invalid" }).success
    ).toBe(false)
    expect(exportFiltersSchema.safeParse({ categoryId: "-1" }).success).toBe(
      false
    )
  })
})
