import { z } from "zod"

const text = z.string().max(10000)
const emptyOrEmail = z.union([z.literal(""), z.email()])
const httpUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      if (/[\u0000-\u0020\\]/.test(value)) return false
      const url = new URL(value)
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      )
    } catch {
      return false
    }
  })
export const siteIdentityTranslationsSchema = z.record(
  z.string().regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i),
  z
    .object({
      title: z.string().max(300).optional(),
      tagline: z.string().max(1000).optional(),
    })
    .strict()
)
const identityJson = z
  .string()
  .max(50000)
  .refine((value) => {
    try {
      return siteIdentityTranslationsSchema.safeParse(JSON.parse(value)).success
    } catch {
      return false
    }
  })

const emailTemplatesJson = z
  .string()
  .max(100000)
  .refine((value) => {
    try {
      return z
        .record(
          z.string().regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i),
          z
            .object({
              email_welcome_subject: z.string().max(1000).optional(),
              email_welcome_heading: z.string().max(1000).optional(),
              email_welcome_body: z.string().max(10000).optional(),
              email_footer_text: z.string().max(10000).optional(),
            })
            .strict()
        )
        .safeParse(JSON.parse(value)).success
    } catch {
      return false
    }
  })

export const settingsPatchSchema = z
  .object({
    email_template_translations: emailTemplatesJson,
    blogname: z.string().trim().min(1).max(300),
    blogdescription: z.string().max(1000),
    site_identity_translations: identityJson,
    admin_email: emptyOrEmail,
    siteurl: httpUrl,
    home: httpUrl,
    users_can_register: z.enum(["0", "1"]),
    disableSignUp: z.enum(["true", "false", "0", "1"]),
    timezone_string: z.string().refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value }).format()
        return true
      } catch {
        return false
      }
    }),
    show_on_front: z.enum(["posts", "page"]),
    page_on_front: z
      .string()
      .regex(/^$|^0$|^[1-9]\d{0,18}$/)
      .refine(
        (value) => !value || BigInt(value) <= BigInt("9223372036854775807")
      ),
    blog_public: z.enum(["0", "1"]),
    seo_meta_title_template: z.string().max(1000),
    seo_default_meta_description: text,
    seo_canonical_enabled: z.enum(["0", "1"]),
    seo_robots_extra: text,
    og_default_image: z.union([
      z.literal(""),
      httpUrl,
      z.string().regex(/^\/(?!\/)[^\s\\]*$/),
    ]),
    og_site_name: text,
    twitter_card_type: z.enum(["summary", "summary_large_image"]),
    twitter_site_handle: text,
    facebook_app_id: text,
    google_site_verification: z.string().max(1000),
    bing_site_verification: z.string().max(1000),
    google_analytics_id: z.string().regex(/^(?:G-[A-Z0-9]+)?$/),
    // These legacy controls have no safe runtime consumer; clearing them remains possible.
    custom_header_scripts: z.literal(""),
    custom_footer_scripts: z.literal(""),
    enable_new_post_notifications: z.literal("0"),
    smtp_host: z
      .string()
      .trim()
      .max(253)
      .regex(/^(?:[a-zA-Z0-9_.-]+|\[[a-fA-F0-9:]+\])?$/),
    smtp_port: z
      .string()
      .refine(
        (value) =>
          /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 65535
      ),
    smtp_user: z
      .string()
      .max(1000)
      .regex(/^[^\r\n\u0000]*$/),
    smtp_pass: z
      .string()
      .max(10000)
      .refine((value) => !value.startsWith("enc:gcm:")),
    smtp_from_email: emptyOrEmail,
    smtp_from_name: z
      .string()
      .max(300)
      .regex(/^[^\r\n\u0000]*$/),
    smtp_secure: z.enum(["tls", "ssl", "none"]),
    admin_notification_email: emptyOrEmail,
    enable_newsletter_notifications: z.enum(["0", "1"]),
    email_new_post_subject: text,
    email_new_post_heading: text,
    email_welcome_subject: text,
    email_welcome_heading: text,
    email_welcome_body: text,
    email_footer_text: text,
  })
  .partial()
  .strict()

export const testEmailSchema = z.email()

export const testEmailLocaleSchema = z
  .string()
  .max(35)
  .regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i)
  .optional()
