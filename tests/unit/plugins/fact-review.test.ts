vi.mock("server-only", () => ({}))
import { describe, it, expect, vi } from "vitest"
vi.mock("@/db", () => ({ db: {} }))
import {
  factReviewSchema,
  type FactReviewRecord,
} from "@/db/schema/cms-fact-reviews"
import {
  factSourceHash,
  publicFactReview,
} from "@/services/fact-review.service"
const source = {
    postTitle: "Claim",
    postContent: "<p>Evidence</p>",
    postExcerpt: "Summary",
  },
  hash = factSourceHash(source)
const input = {
  postId: "1",
  expectedVersion: 0,
  sourceHash: hash,
  claim: "Claim",
  summary: "Explanation",
  sources: ["https://example.org/source"],
  status: "supported" as const,
  approve: true,
}
describe("evidence-based fact review", () => {
  it("requires sources, explanation and explicit approval for verdicts", () => {
    expect(factReviewSchema.safeParse(input).success).toBe(true)
    for (const patch of [
      { sources: [] },
      { approve: false },
      { summary: "" },
      { claim: "" },
      { sources: ["javascript:bad()"] },
    ])
      expect(factReviewSchema.safeParse({ ...input, ...patch }).success).toBe(
        false
      )
    expect(
      factReviewSchema.safeParse({
        ...input,
        status: "in_review",
        sources: [],
        approve: false,
      }).success
    ).toBe(true)
  })
  it("shows no default badge and invalidates approval after article edits", () => {
    const record: FactReviewRecord = {
      ...input,
      version: 1,
      reviewerId: "editor",
      reviewerName: "Editor",
      reviewedAt: new Date().toISOString(),
      approved: true,
    }
    const data = {
      postId: "1",
      title: "Claim",
      sourceHash: hash,
      current: record,
      history: [record],
    }
    expect(publicFactReview({ ...data, current: null })).toBeNull()
    expect(
      publicFactReview({ ...data, current: { ...record, approved: false } })
    ).toBeNull()
    expect(publicFactReview(data)).toEqual(record)
    expect(
      publicFactReview({
        ...data,
        sourceHash: factSourceHash({ ...source, postContent: "Changed" }),
      })
    ).toBeNull()
  })
})
