import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { admin } from "better-auth/plugins";
import * as schema from "@/db/schema/auth-schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema,
    }),

    emailAndPassword:{
        enabled: true,
    },
    // user: {
    //     additionalFields: {
    //         role: {
    //             type: "string",
    //             required: false,
    //             defaultValue: "user",
    //             input: false,
    //         },
    //     },
    // },

    plugins: [
        admin() 
    ]
});