import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
import { saveStudioPageData } from "./studio-document.service"
import { createStudioElement } from "@/lib/studio/tree-helpers"

vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/db/schema", () => ({
  wpPosts: { id: "id", postType: "type", postStatus: "status" },
  wpPostmeta: { postId: "postId", metaKey: "metaKey" },
  wpOptions: { optionName: "optionName" },
}))

const input = {
  pageId: "1",
  status: "publish",
  setAsFrontPage: true,
  document: {
    version: "1.0",
    pageTemplate: "studio_canvas",
    elements: [],
    settings: { hideTitle: true },
  },
}

function databaseHarness({
  missing = false,
  failInsert = false,
  status = "publish",
} = {}) {
  const metadata = [{ metaKey: "_studio_data", metaValue: "old layout" }]
  const options: unknown[] = []
  const transaction = vi.fn(
    async (callback: (tx: unknown) => Promise<unknown>) => {
      const nextMetadata = [...metadata]
      const nextOptions: unknown[] = []
      const tx = {
        update: () => ({
          set: () => ({
            where: () => ({
              returning: async () => (missing ? [] : [{ status }]),
            }),
          }),
        }),
        delete: () => ({
          where: async () => {
            nextMetadata.length = 0
          },
        }),
        insert: () => ({
          values: (values: typeof metadata) => {
            if (failInsert) throw new Error("Simulated storage failure")
            if (values[0]?.metaKey) {
              nextMetadata.push(...values)
              return Promise.resolve()
            }
            return {
              onConflictDoUpdate: async () => {
                nextOptions.push(...values)
              },
            }
          },
        }),
      }
      const result = await callback(tx)
      metadata.splice(0, metadata.length, ...nextMetadata)
      options.push(...nextOptions)
      return result
    }
  )
  return {
    database: { transaction } as unknown as DB,
    transaction,
    metadata,
    options,
  }
}

describe("Studio save transaction contract", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores and returns sanitized markup in the same committed document", async () => {
    const harness = databaseHarness()
    const element = createStudioElement("html")
    element.settings.htmlCode = "<p>Safe</p><script>alert(1)</script>"
    const result = await saveStudioPageData(
      { ...input, document: { ...input.document, elements: [element] } },
      harness.database
    )
    const saved = JSON.parse(
      harness.metadata.find((row) => row.metaKey === "_studio_data")!.metaValue
    )
    expect(saved.elements[0].settings.htmlCode).toBe("<p>Safe</p>")
    expect(result.document).toEqual(saved)
    expect(element.settings.htmlCode).toContain("<script>")
  })

  it("rejects assigning a draft as homepage without replacing its layout", async () => {
    const harness = databaseHarness({ status: "draft" })
    await expect(
      saveStudioPageData({ ...input, status: "draft" }, harness.database)
    ).rejects.toThrow("Only published pages")
    expect(harness.metadata[0].metaValue).toBe("old layout")
    expect(harness.options).toEqual([])
  })

  it("validates before opening a transaction", async () => {
    const harness = databaseHarness()
    await expect(
      saveStudioPageData(
        { ...input, status: "administrator" },
        harness.database
      )
    ).rejects.toThrow()
    expect(harness.transaction).not.toHaveBeenCalled()
  })

  it("does not replace metadata for a missing or non-page target", async () => {
    const harness = databaseHarness({ missing: true })
    await expect(saveStudioPageData(input, harness.database)).rejects.toThrow(
      "does not exist"
    )
    expect(harness.metadata[0].metaValue).toBe("old layout")
    expect(harness.options).toEqual([])
  })

  it("retains the old layout and homepage when a write fails", async () => {
    const harness = databaseHarness({ failInsert: true })
    await expect(saveStudioPageData(input, harness.database)).rejects.toThrow(
      "storage failure"
    )
    expect(harness.metadata[0].metaValue).toBe("old layout")
    expect(harness.options).toEqual([])
  })

  it("commits document settings and homepage assignment together", async () => {
    const harness = databaseHarness()
    await saveStudioPageData(input, harness.database)
    const saved = JSON.parse(
      harness.metadata.find((row) => row.metaKey === "_studio_data")!.metaValue
    )
    expect(saved.settings.hideTitle).toBe(true)
    expect(harness.options).toHaveLength(2)
    expect(harness.transaction).toHaveBeenCalledTimes(1)
  })
})
