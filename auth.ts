import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import {
  admin,
  lastLoginMethod,
  haveIBeenPwned,
  magicLink,
  emailOTP,
} from "better-auth/plugins"
import * as schema from "@/db/schema/auth-schema"
import { existingAccountAlertTemplate } from "@/templates/email.templates"
import { sendEmail } from "@/lib/email"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { env } from "@/lib/env"
import { getOption } from "@/services/settings.service"
import { sendAuthEmail } from "@/lib/auth-email"
import { securedTwoFactor } from "@/lib/auth-two-factor"
import { safeAuthRedirect } from "@/lib/auth-navigation"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail("reset", user.email, url, user.name)
    },

    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,

    onExistingUserSignUp: async ({ user }, request) => {
      const siteName = await getOption("blogname", "PressForge News")
      const frontendUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      // Extract real client IP and User Agent from the incoming request
      const ipAddress =
        request?.headers.get("cf-connecting-ip") ||
        request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request?.headers.get("x-real-ip") ||
        undefined

      const userAgent = request?.headers.get("user-agent") || undefined

      await sendEmail({
        to: user.email,
        subject: `🛡️ تنبيه أمان: محاولة تسجيل جديدة عبر بريدك الإلكتروني - ${siteName}`,
        html: existingAccountAlertTemplate({
          name: user.name || undefined,
          siteName,
          ipAddress,
          userAgent,
          loginUrl: `${frontendUrl}/cms-login`,
          resetPasswordUrl: `${frontendUrl}/forgot-password`,
        }),
        text: `تنبيه أمان من ${siteName}: تم رصد محاولة لإنشاء حساب جديد باستخدام بريدك الإلكتروني (IP: ${ipAddress || "غير محدد"}). إذا كنت أنت من قام بالمحاولة يمكنك تسجيل الدخول عبر: ${frontendUrl}/cms-login`,
      })
    },
  },

  telemetry: {
    enabled: true,
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email" || ctx.path.startsWith("/sign-up")) {
        const disableSignUp = await getOption("disableSignUp", "false")
        const usersCanRegister = await getOption("users_can_register", "1")
        if (
          disableSignUp === "true" ||
          disableSignUp === "1" ||
          usersCanRegister === "0"
        ) {
          throw new APIError("FORBIDDEN", {
            message: "التسجيل مغلق حالياً من قبل الإدارة",
          })
        }
      }
    }),
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

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail("verify", user.email, url, user.name)
    },
  },

  session: {
    expiresIn: 60 * 60,
    freshAge: 30 * 60,
  },

  rateLimit: {
    window: 60,
    max: 100,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },

  advanced: {
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },

  plugins: [
    // turnstilePlugin({
    //     secretKey: env.TURNSTILE_SECRET_KEY,
    //     endpoints: [
    //         "/sign-in/email",
    //         "/sign-up/email",
    //         "/request-password-reset",
    //         "/email-otp/send-verification-otp",
    //         "/sign-in/magic-link",
    //     ],
    // }),
    magicLink({
      disableSignUp: true,
      expiresIn: 300,
      storeToken: "hashed",
      sendMagicLink: async ({ email, token, url }) => {
        const callbackUrl = safeAuthRedirect(
          new URL(url).searchParams.get("callbackURL")
        )
        const directLink = new URL("/magic-link", env.NEXT_PUBLIC_APP_URL)
        directLink.searchParams.set("token", token)
        directLink.searchParams.set("callbackUrl", callbackUrl)
        directLink.searchParams.set(
          "login",
          callbackUrl.startsWith("/admincp") ? "/cms-admin" : "/cms-login"
        )
        await sendAuthEmail("magic", email, directLink.toString())
      },
    }),
    emailOTP({
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendAuthEmail("otp", email, otp, "", type)
      },
    }),

    lastLoginMethod(),
    securedTwoFactor({
      issuer: "PressForge",
      totpOptions: { period: 30, digits: 6 },
      backupCodeOptions: { amount: 10, length: 10 },
    }),
    admin({
      defaultRole: "subscriber",
    }),
    haveIBeenPwned(),
    nextCookies(),
  ],
})
