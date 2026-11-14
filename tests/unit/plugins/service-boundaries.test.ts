import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  reads: vi.fn(),
  writes: [] as unknown[],
  rows: [] as unknown[][],
  events: [] as string[],
}))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("redirect:" + path)
  },
}))
vi.mock("@/db", () => {
  const database = {
    execute: async () => {
      mocks.events.push("lock")
    },
    select: () => {
      mocks.reads()
      mocks.events.push("read")
      return {
        from: () => {
          const chain = {
            where: () => chain,
            for: () => chain,
            limit: async () => mocks.rows.shift() || [],
          }
          return chain
        },
      }
    },
    insert: () => ({
      values: (value: unknown) => ({
        onConflictDoUpdate: async () => {
          mocks.events.push("write")
          mocks.writes.push(value)
        },
      }),
    }),
    delete: () => {
      mocks.events.push("delete")
      return { where: async () => {} }
    },
    transaction: async (
      work: (db: unknown) => Promise<unknown>
    ): Promise<unknown> => work(database),
  }
  return { db: database }
})
import {
  togglePlugin,
  bulkUpdatePlugins,
  getActivePluginSlugs,
  getInstalledPluginSlugs,
} from "@/services/plugin.service"
import { savePluginConfig } from "@/lib/plugins/config"
import { saveFactReview, factSourceHash } from "@/services/fact-review.service"
import {
  removeNewsletterSubscriber,
  clearAllNewsletterSubscribers,
  getNewsletterSubscribers,
} from "@/lib/newsletter/db"
import { newsletterCsvCell } from "@/lib/newsletter/csv"
beforeEach(() => {
  vi.clearAllMocks()
  mocks.rows = []
  mocks.writes = []
  mocks.events = []
  mocks.session.mockResolvedValue({
    user: { id: "admin", name: "Administrator", role: "admin" },
  })
})
describe("Plugin service security", () => {
  it.each(["editor", "subscriber", "author"])(
    "blocks direct %s writes and subscriber reads",
    async (role) => {
      mocks.session.mockResolvedValue({ user: { id: "other", role } })
      for (const action of [
        () => togglePlugin("newsletter", true),
        () => savePluginConfig("ad-manager", { enabled: true }),
        () => saveFactReview({} as never, { id: "forged", name: "Forged" }),
        () => removeNewsletterSubscriber("reader@example.test"),
        () => clearAllNewsletterSubscribers(),
        () => getNewsletterSubscribers(),
      ])
        await expect(action()).rejects.toThrow("redirect:")
      expect(mocks.reads).not.toHaveBeenCalled()
      expect(mocks.events).toEqual([])
    }
  )
  it("does not reactivate defaults from corrupt active-plugin state", async () => {
    mocks.rows = [[{ value: "not-json" }]]
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(await getActivePluginSlugs()).toEqual([])
    } finally {
      log.mockRestore()
    }
  })
  it("only loads known bundled plugin identifiers from legacy state", async () => {
    mocks.rows = [
      [
        {
          value: JSON.stringify([
            "__proto__",
            "constructor",
            "newsletter/plugin.php",
            "unknown",
            "social-share",
          ]),
        },
      ],
    ]
    expect(await getActivePluginSlugs()).toEqual(["newsletter"])
    mocks.rows = [
      [{ value: JSON.stringify(["__proto__", "newsletter", "newsletter"]) }],
    ]
    expect(await getInstalledPluginSlugs()).toEqual(["newsletter"])
  })
  it("rejects invalid state mutation arguments", async () => {
    await expect(togglePlugin("newsletter", "yes" as never)).rejects.toThrow()
    await expect(
      bulkUpdatePlugins(["newsletter"], "invalid" as never)
    ).rejects.toThrow()
    expect(mocks.writes).toEqual([])
  })
  it("locks configuration before merging partial updates and strips hostile markup", async () => {
    mocks.rows = [
      [
        {
          value: JSON.stringify({
            enabled: false,
            sponsorName: "Existing",
            placement: "before_content",
          }),
        },
      ],
    ]
    await savePluginConfig("ad-manager", {
      customHtml:
        '<script>bad()</script><a target="_blank" href="/sponsor">Sponsor</a>',
    })
    expect(mocks.events.slice(0, 2)).toEqual(["lock", "read"])
    expect(mocks.writes).toHaveLength(1)
    const value = mocks.writes[0] as { optionValue: string }
    const config = JSON.parse(value.optionValue)
    expect(config.enabled).toBe(false)
    expect(config.sponsorName).toBe("Existing")
    expect(config.placement).toBe("before_content")
    expect(config.customHtml).not.toContain("<script")
    expect(config.customHtml).toContain("noopener")
  })
  it.each(["=cmd()", " +cmd()", "\n=cmd()", "\t@cmd()", "\ufeff-cmd()"])(
    "neutralizes spreadsheet formulas in %j",
    (value) => {
      expect(newsletterCsvCell(value).startsWith(`"'`)).toBe(true)
    }
  )
  it("records the authenticated reviewer rather than caller-supplied authorship", async () => {
    const post = {
      postTitle: "Claim",
      postContent: "Body",
      postExcerpt: "Summary",
    }
    mocks.rows = [[post], []]
    const record = await saveFactReview(
      {
        postId: "1",
        sourceHash: factSourceHash(post),
        expectedVersion: 0,
        claim: "Claim",
        summary: "Evidence",
        sources: ["https://source.test"],
        status: "supported",
        approve: true,
      },
      { id: "forged", name: "Forged" }
    )
    expect(record.reviewerId).toBe("admin")
    expect(record.reviewerName).toBe("Administrator")
  })
})

it("does not reactivate newsletter when a stored active option is empty", async () => {
  mocks.rows = [[{ value: "" }]]
  expect(await getActivePluginSlugs()).toEqual([])
})
