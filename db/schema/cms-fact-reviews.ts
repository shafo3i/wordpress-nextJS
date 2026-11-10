import { z } from "zod"

export const factPostIdSchema = z
  .string()
  .regex(/^[1-9]\d{0,18}$/)
  .refine((v) => BigInt(v) <= BigInt("9223372036854775807"))
export const factStatusSchema = z.enum([
  "unreviewed",
  "in_review",
  "supported",
  "misleading",
  "false",
  "insufficient",
])
export const factReviewSchema = z
  .object({
    postId: factPostIdSchema,
    expectedVersion: z.number().int().nonnegative(),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    claim: z.string().trim().max(2000),
    summary: z.string().trim().max(8000),
    sources: z
      .array(
        z
          .string()
          .url()
          .max(2048)
          .refine((v) => {
            const u = new URL(v)
            return u.protocol === "https:" && !u.username && !u.password
          })
      )
      .max(20),
    status: factStatusSchema,
    approve: z.boolean(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      !["unreviewed", "in_review"].includes(v.status) &&
      (!v.approve || !v.claim || !v.summary || !v.sources.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "admin.plugins.fact.evidence_required",
      })
  })
export type FactReviewInput = z.infer<typeof factReviewSchema>
export type FactReviewRecord = Omit<
  FactReviewInput,
  "expectedVersion" | "approve" | "postId"
> & {
  version: number
  reviewerId: string
  reviewerName: string
  reviewedAt: string
  approved: boolean
}

export const factReviewHistorySchema = z.array(
  z.object({
    claim: z.string().max(2000),
    summary: z.string().max(8000),
    sources: z
      .array(
        z
          .string()
          .url()
          .refine((value) => {
            const url = new URL(value)
            return url.protocol === "https:" && !url.username && !url.password
          })
      )
      .max(20),
    status: z.enum([
      "unreviewed",
      "in_review",
      "supported",
      "misleading",
      "false",
      "insufficient",
    ]),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    version: z.number().int().positive(),
    reviewerId: z.string(),
    reviewerName: z.string(),
    reviewedAt: z.string().datetime(),
    approved: z.boolean(),
  })
)
