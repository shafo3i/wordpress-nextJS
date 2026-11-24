import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ guard: vi.fn(), save: vi.fn(), remove: vi.fn(), revalidate: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ RateLimitError: class extends Error {} }))
vi.mock("@/services/podcast-show.service", () => ({ savePodcastShow: mocks.save, deletePodcastShow: mocks.remove, PodcastShowError: class extends Error {} }))
import { saveShowAction, deleteShowAction } from "@/app/(admin)/admincp/podcasts/shows/action"
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { id: "admin" } }); mocks.save.mockResolvedValue("1"); mocks.remove.mockResolvedValue(undefined) })
function form(extra: Record<string, string> = {}) {
  const data = new FormData()
  for (const [key, value] of Object.entries({ name: "Programme", languageCode: "en", ...extra })) data.set(key, value)
  return data
}
it("rejects forged show settings before calling the persistence service", async () => {
  await expect(saveShowAction(form({ status: "admin", website: "javascript:alert(1)" }))).resolves.toEqual({ error: "admin.podcasts.error.invalid" })
  await expect(deleteShowAction("-1")).resolves.toEqual({ error: "admin.podcasts.error.invalid" })
  expect(mocks.save).not.toHaveBeenCalled()
  expect(mocks.remove).not.toHaveBeenCalled()
})
it("does not disclose database errors to the browser", async () => {
  mocks.save.mockRejectedValueOnce(new Error("secret database connection details"))
  await expect(saveShowAction(form())).resolves.toEqual({ error: "admin.podcasts.error.failed" })
})
it("checks permission before parsing or saving and lets authentication failures propagate", async () => {
  mocks.guard.mockRejectedValueOnce(new Error("denied"))
  await expect(saveShowAction(form())).rejects.toThrow("denied")
  expect(mocks.save).not.toHaveBeenCalled()
})
it("returns the saved ID and refreshes the show list after successful mutations", async () => {
  await expect(saveShowAction(form())).resolves.toEqual({ id: "1" })
  await expect(deleteShowAction("1")).resolves.toEqual({ success: true })
  expect(mocks.revalidate).toHaveBeenCalledWith("/admincp/podcasts/shows")
})
