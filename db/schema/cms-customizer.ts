import { z } from "zod"

const modValue = z.union([
  z.string().max(20_000),
  z.number().finite(),
  z.boolean(),
])
export const customizerModsSchema = z
  .record(
    z
      .string()
      .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/)
      .refine(
        (key) => !["constructor", "prototype", "__proto__"].includes(key)
      ),
    modValue
  )
  .refine(
    (value) =>
      Object.keys(value).length <= 500 &&
      JSON.stringify(value).length <= 200_000
  )
