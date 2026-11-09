import { describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }))
vi.mock("@/db", () => ({ db: { transaction: mocks.transaction } }))
import { createPost, updatePost } from "@/services/post.service"

describe("post write transaction boundaries", () => {
  it("routes creation and update through the transaction before writing", async () => {
    const sentinel = new Error("transaction boundary")
    mocks.transaction.mockRejectedValue(sentinel)
    await expect(createPost({ title: "Post" })).rejects.toBe(sentinel)
    await expect(updatePost("1", { title: "Post" })).rejects.toBe(sentinel)
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
  })
})
