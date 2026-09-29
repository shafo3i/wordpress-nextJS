import { z } from "zod";


const envSchema = z.object({
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string(),
    NEXT_PUBLIC_APP_URL: z.string(),
})

export const env = envSchema.parse(process.env)
