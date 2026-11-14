vi.mock("server-only", () => ({}));
vi.mock("@/lib/authMIddleware", () => ({ verifyPostEditor: async () => ({ user: { id: "editor", role: "editor" } }) }));
import { describe, it, expect, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("@/db", () => ({ db: {} }))
import { updateMediaDetails } from "@/services/media-details.service"
describe("attachment mutation boundaries", () => {
  it("rejects missing or non-attachment rows before writing", async () => {
    const update = vi.fn(),
      insert = vi.fn()
    const tx = {
      select: () => ({
        from: () => ({
          where: () => ({ for: () => ({ limit: async () => [] }) }),
        }),
      }),
      update,
      insert,
    }
    const database = {
      transaction: async (fn: (value: typeof tx) => unknown) => fn(tx),
    } as unknown as DB
    await expect(
      updateMediaDetails(42, { title: "Changed" }, database)
    ).rejects.toThrow("admin.media.details_not_found")
    expect(update).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })
  it("saves attachment text and alt text together inside the transaction", async () => {
    let selects = 0
    const changes: unknown[] = [],
      metas: unknown[] = []
    const tx = {
      select: () => ({
        from: () => ({
          where: () =>
            ++selects === 1
              ? { for: () => ({ limit: async () => [{ id: BigInt(42) }] }) }
              : { limit: async () => [] },
        }),
      }),
      update: () => ({
        set: (data: unknown) => {
          changes.push(data)
          return { where: async () => {} }
        },
      }),
      insert: () => ({
        values: async (data: unknown) => {
          metas.push(data)
        },
      }),
    }
    const transaction = vi.fn(async (fn: (value: typeof tx) => unknown) =>
      fn(tx)
    )
    await updateMediaDetails(
      42,
      {
        title: "Title",
        caption: "Caption",
        description: "Description",
        altText: "Alt",
      },
      { transaction } as unknown as DB
    )
    expect(transaction).toHaveBeenCalledOnce()
    expect(changes[0]).toMatchObject({
      postTitle: "Title",
      postExcerpt: "Caption",
      postContent: "Description",
    })
    expect(metas).toEqual([
      {
        postId: BigInt(42),
        metaKey: "_wp_attachment_image_alt",
        metaValue: "Alt",
      },
    ])
  })
})
