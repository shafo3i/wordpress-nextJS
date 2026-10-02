import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { DB, db } from "@/db"; // your drizzle instance
import {
    admin,
    lastLoginMethod,
    twoFactor,
    haveIBeenPwned,
    magicLink,
    emailOTP,
} from "better-auth/plugins";
import * as schema from "@/db/schema/auth-schema";
import { emailOtpTemplate, magicLinkTemplate, verifyEmailTemplate, passwordResetTemplate, existingAccountAlertTemplate } from '@/templates/email.templates';
import { sendEmail } from '@/lib/email';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from "better-auth/next-js";
import { env } from "@/lib/env";
import { getOption } from "@/services/settings.service";




export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema,
    }),

    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }: { user: { email: string; name?: string | null }; url: string }) => {
            const siteName = await getOption("blogname", "PressForge News");
            await sendEmail({
                to: user.email,
                subject: "إعادة تعيين كلمة المرور - " + siteName,
                html: passwordResetTemplate(user.name || "المشرف", url, siteName),
                text: `رابط إعادة تعيين كلمة المرور: ${url}`,
            });
        },

        revokeSessionsOnPasswordReset: true,
        resetPasswordTokenExpiresIn: 60 * 60 * 1000,
        accountLocking: {
            enabled: true,
            maxFailedAttempts: 5,
            lockoutDuration: 15 * 60 * 1000,
        },

        onExistingUserSignUp: async ({ user }, request) => {

            const siteName = await getOption("blogname", "PressForge News");
            const frontendUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

            // Extract real client IP and User Agent from the incoming request
            const ipAddress =
                request?.headers.get('cf-connecting-ip') ||
                request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                request?.headers.get('x-real-ip') ||
                undefined;

            const userAgent = request?.headers.get('user-agent') || undefined;

            await sendEmail({
                to: user.email,
                subject: `🛡️ تنبيه أمان: محاولة تسجيل جديدة عبر بريدك الإلكتروني - ${siteName}`,
                html: existingAccountAlertTemplate({
                    name: user.name || undefined,
                    siteName,
                    ipAddress,
                    userAgent,
                    loginUrl: `${frontendUrl}/auth/login`,
                    resetPasswordUrl: `${frontendUrl}/forgot-password`,
                }),
                text: `تنبيه أمان من ${siteName}: تم رصد محاولة لإنشاء حساب جديد باستخدام بريدك الإلكتروني (IP: ${ipAddress || 'غير محدد'}). إذا كنت أنت من قام بالمحاولة يمكنك تسجيل الدخول عبر: ${frontendUrl}/auth/login`,
            });
        },

    },

    telemetry: {
        enabled: true,
    },

    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email" || ctx.path.startsWith("/sign-up")) {
                const disableSignUp = await getOption("disableSignUp", "false");
                const usersCanRegister = await getOption("users_can_register", "1");
                if (disableSignUp === "true" || disableSignUp === "1" || usersCanRegister === "0") {
                    throw new APIError("FORBIDDEN", {
                        message: "التسجيل مغلق حالياً من قبل الإدارة",
                    });
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
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string | null }; url: string }) => {
            const siteName = await getOption("blogname", "PressForge News");
            await sendEmail({
                to: user.email,
                subject: "تأكيد بريدك الإلكتروني - " + siteName,
                html: verifyEmailTemplate(user.name || "المستخدم", url, siteName),
                text: `رابط تأكيد الحساب: ${url}`,
            });
        },
    },

    session: {
        expiresIn: 60 * 60 * 1000,
        freshAge: 30 * 60 * 1000,
        idleTimeout: 15 * 60 * 1000,

    },

    rateLimit: {
        window: 1 * 60 * 1000,
        max: 100,
        storage: 'database',
    },

    advanced: {
        ipAddress: {
            ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip']
        }
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
            generateToken: () => crypto.randomUUID(),
            sendMagicLink: async ({ email, token }: { email: string; token: string }) => {
                const frontendUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                const directLink = `${frontendUrl}/magic-link?token=${token}`;
                const siteName = await getOption("blogname", "PressForge News");

                await sendEmail({
                    to: email,
                    subject: "رابط الدخول المباشر - " + siteName,
                    html: magicLinkTemplate(directLink, siteName),
                    text: `رابط تسجيل الدخول المباشر الخاص بك في ${siteName}: ${directLink}`,
                });
            },
        }),
        emailOTP({
            sendVerificationOTP: async ({ email, otp, type }: { email: string; otp: string; type: string }) => {
                const siteName = await getOption("blogname", "PressForge News");

                await sendEmail({
                    to: email,
                    subject: `رمز التحقق الخاص بك: ${otp} - ${siteName}`,
                    html: emailOtpTemplate(otp, type, siteName),
                    text: `رمز التحقق الخاص بك في ${siteName} هو: ${otp} (صالح لمدة 5 دقائق).`,
                });
            },
        }),

        lastLoginMethod(),
        twoFactor({
            issuer: "PressForge",
            otpOptions: {
                period: 300,
                digits: 6,
                algorithm: "sha1",
                window: 1,
            },
            backupCodeOptions: {
                amount: 10,
                length: 10,
            },
        }),
        admin({
            defaultRole: "subscriber",
        }),
        haveIBeenPwned(),
        nextCookies(),
    ]
});