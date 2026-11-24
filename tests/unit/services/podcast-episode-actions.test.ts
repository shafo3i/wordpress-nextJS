import { beforeEach, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ guard: vi.fn(), save: vi.fn(), remove: vi.fn(), shows: vi.fn(), revalidate: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({ RateLimitError: class extends Error {} }))
vi.mock("@/services/podcast-episode.service", () => ({ savePodcastEpisode: mocks.save, deletePodcastEpisode: mocks.remove, PodcastEpisodeError: class extends Error {} }))
vi.mock("@/services/podcast-show.service", () => ({ listPodcastShows: mocks.shows }))
import { saveEpisodeAction, deleteEpisodeAction, searchEpisodeShowsAction } from "@/app/(admin)/admincp/podcasts/episodes/action"
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockReset().mockResolvedValue({ user: { id: "admin" } }); mocks.save.mockReset().mockResolvedValue("11"); mocks.remove.mockResolvedValue(undefined) })
function form(extra: Record<string, string> = {}) {
  const data = new FormData()
  for (const [key, value] of Object.entries({ postTitle: "Episode", languageCode: "en", showId: "2", ...extra })) data.set(key, value)
  return data
}
it("blocks unauthorized actions and show searches before service calls", async () => {
  mocks.guard.mockRejectedValue(new Error("denied"))
  await expect(saveEpisodeAction(form())).rejects.toThrow("denied")
  await expect(deleteEpisodeAction("11")).rejects.toThrow("denied")
  await expect(searchEpisodeShowsAction({})).rejects.toThrow("denied")
  expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.shows).not.toHaveBeenCalled()
})
it("rejects unsafe embeds and publication without media", async () => {
  await expect(saveEpisodeAction(form({ videoUrl: "javascript:alert(1)" }))).resolves.toEqual({ error: "admin.podcasts.episode_error.invalid" })
  await expect(saveEpisodeAction(form({ status: "publish" }))).resolves.toEqual({ error: "admin.podcasts.episode_error.invalid" })
  expect(mocks.save).not.toHaveBeenCalled()
})
it("returns generic errors without leaking database or storage details", async () => {
  mocks.save.mockRejectedValue(new Error("private connection string"))
  await expect(saveEpisodeAction(form())).resolves.toEqual({ error: "admin.podcasts.episode_error.failed" })
})
it("saves drafts and invalidates the episode list", async () => {
  await expect(saveEpisodeAction(form())).resolves.toEqual({ id: "11" })
  expect(mocks.revalidate).toHaveBeenCalledWith("/admincp/podcasts/episodes")
})
