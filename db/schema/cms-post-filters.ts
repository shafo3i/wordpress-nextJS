import { z } from "zod"

const day = z.iso
  .date()
  .refine(
    (value) =>
      Number(value.slice(0, 4)) >= 1000 && Number(value.slice(0, 4)) < 9999
  )
export const postDateFilterSchema = z
  .object({
    date: z
      .union([
        z.enum(["all", "today", "month", "range"]),
        z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/),
      ])
      .default("all"),
    from: z.preprocess(
      (value) => (value === "" ? undefined : value),
      day.optional()
    ),
    to: z.preprocess(
      (value) => (value === "" ? undefined : value),
      day.optional()
    ),
  })
  .refine(
    (value) =>
      value.date !== "range" ||
      !value.from ||
      !value.to ||
      value.from <= value.to,
    { path: ["to"], message: "invalid_date_range" }
  )

const postIdPattern = /^[1-9]\d{0,18}$/
export const postViewIdSchema = z
  .string()
  .regex(postIdPattern)
  .refine(
    (value) =>
      postIdPattern.test(value) &&
      BigInt(value) <= BigInt("9223372036854775807")
  )
