import { describe, expect, it, vi } from "vitest"
import type { DB } from "@/db"
vi.mock("@/db", () => ({ db: {} }))
import { createPost, updatePost, PostPermissionError } from "@/services/post.service"
describe("editor post lifecycle restrictions", () => {
  it("cannot create a trashed post through a forged status", async () => {
    const database = { insert: vi.fn() } as unknown as DB
    await expect(createPost({ title: "Post", status: "trash", editorRestricted: true }, database)).rejects.toBeInstanceOf(PostPermissionError)
    expect(database.insert).not.toHaveBeenCalled()
  })
  it.each([["publish", "trash"], ["trash", "publish"]])("cannot change %s to %s", async (existing, requested) => {
    const chain = { from: () => chain, where: () => chain, limit: () => chain, for: async () => [{ id: BigInt(1), status: existing }] }
    const database = { select: () => chain, update: vi.fn() } as unknown as DB
    await expect(updatePost("1", { status: requested, editorRestricted: true }, database)).rejects.toBeInstanceOf(PostPermissionError)
    expect(database.update).not.toHaveBeenCalled()
  })
})
