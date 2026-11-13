import { describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
import { setOptions } from "@/services/settings.service"

describe("settings persistence", () => {
  it("saves related identity values through the same transaction", async () => {
    const insert = vi.fn<(value: unknown) => Promise<void>>(
      async () => undefined
    )
    const transaction = {
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [] }) }),
      }),
      insert: () => ({ values: insert }),
    }
    const transact = vi.fn(
      async (callback: (value: unknown) => Promise<void>) =>
        callback(transaction)
    )
    await setOptions(
      {
        blogname: "Name",
        site_identity_translations: '{"en":{"title":"English"}}',
      },
      { transaction: transact } as unknown as DB
    )
    expect(transact).toHaveBeenCalledOnce()
    expect(insert.mock.calls.map((call) => call[0])).toEqual([
      { optionName: "blogname", optionValue: "Name", autoload: "yes" },
      {
        optionName: "site_identity_translations",
        optionValue: '{"en":{"title":"English"}}',
        autoload: "yes",
      },
    ])
  })
  it("propagates write failures to the transaction rather than reporting success", async () => {
    const error = new Error("write failed")
    const transaction = {
      select: () => ({
        from: () => ({ where: () => ({ limit: async () => [] }) }),
      }),
      insert: () => ({
        values: async () => {
          throw error
        },
      }),
    }
    const database = {
      transaction: async (callback: (value: unknown) => Promise<void>) =>
        callback(transaction),
    } as unknown as DB
    await expect(setOptions({ blogname: "Name" }, database)).rejects.toBe(error)
  })
})
