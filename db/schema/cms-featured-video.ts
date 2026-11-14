import { z } from "zod"
import { featuredVideoUrl } from "@/lib/featured-video"
export const featuredVideoSchema = z
  .string()
  .max(2000)
  .refine((value) => value === "" || Boolean(featuredVideoUrl(value)))
  .transform((value) => (value === "" ? "" : featuredVideoUrl(value)!))
