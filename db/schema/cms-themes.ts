import { z } from "zod"
export const themeSlugSchema = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
export const themeSearchSchema = z.string().trim().max(200)
