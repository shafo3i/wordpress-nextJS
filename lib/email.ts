import { getEmailLanguage } from "@/lib/email-language"
import { absoluteWebUrl } from "@/lib/seo/urls"
import { escapeEmailHtml, localizedEmail } from "@/templates/localized-email"
import { localizedEmailTemplates } from "@/lib/email-template-settings"
import nodemailer from "nodemailer"
import { getOptions } from "@/services/settings.service"
import { decryptValue } from "@/lib/encryption"
import { newPostNotificationTemplate } from "@/templates/email.templates"

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SmtpSettings {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_from_email: string
  smtp_from_name: string
  smtp_secure: string
  admin_notification_email: string
  admin_email: string
  enable_new_post_notifications: string
  enable_newsletter_notifications: string
  blogname: string
  email_new_post_subject: string
  email_new_post_heading: string
  email_welcome_subject: string
  email_welcome_heading: string
  email_welcome_body: string
  email_footer_text: string
  [key: string]: string
}

/**
 * Fetch SMTP & Notification settings directly from wp_options with AES-256 decryption.
 */
export async function getSmtpSettings(): Promise<SmtpSettings> {
  const keys = [
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_from_email",
    "smtp_from_name",
    "smtp_secure",
    "admin_notification_email",
    "admin_email",
    "enable_new_post_notifications",
    "enable_newsletter_notifications",
    "blogname",
    "email_new_post_subject",
    "email_new_post_heading",
    "email_welcome_subject",
    "email_welcome_heading",
    "email_welcome_body",
    "email_footer_text",
    "email_template_translations",
  ]

  const settings = await getOptions(keys)

  return {
    ...settings,
    smtp_host: settings.smtp_host ?? "",
    smtp_port: settings.smtp_port ?? "587",
    smtp_user: settings.smtp_user ?? "",
    smtp_pass: settings.smtp_pass ? decryptValue(settings.smtp_pass) : "",
    smtp_from_email: settings.smtp_from_email ?? "",
    smtp_from_name: settings.smtp_from_name ?? "",
    smtp_secure: settings.smtp_secure ?? "tls",
    admin_notification_email: settings.admin_notification_email ?? "",
    admin_email: settings.admin_email ?? "",
    enable_new_post_notifications:
      settings.enable_new_post_notifications ?? "0",
    enable_newsletter_notifications:
      settings.enable_newsletter_notifications ?? "0",
    blogname: settings.blogname ?? "PressForge News",
    email_new_post_subject: settings.email_new_post_subject ?? "",
    email_new_post_heading: settings.email_new_post_heading ?? "",
    email_welcome_subject: settings.email_welcome_subject ?? "",
    email_welcome_heading: settings.email_welcome_heading ?? "",
    email_welcome_body: settings.email_welcome_body ?? "",
    email_footer_text: settings.email_footer_text ?? "",
  }
}

/**
 * Send an email using SMTP settings configured in wp_options (or .env fallback)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailOptions): Promise<EmailSendResult> {
  try {
    const settings = await getSmtpSettings()

    const dbHost = settings.smtp_host?.trim()
    const dbUser = settings.smtp_user?.trim()
    const dbPass = settings.smtp_pass

    const hasDbSmtp = Boolean(dbHost && dbUser && dbPass)

    const host = hasDbSmtp ? dbHost : (process.env.SMTP_HOST || "").trim()
    const user = hasDbSmtp
      ? dbUser
      : (process.env.SMTP_USER || process.env.SMTP_USERNAME || "").trim()
    const pass = hasDbSmtp
      ? dbPass
      : process.env.SMTP_PASS || process.env.SMTP_PASSWORD || ""
    const port = parseInt(
      (hasDbSmtp ? settings.smtp_port : process.env.SMTP_PORT) || "587",
      10
    )
    const secureSetting = hasDbSmtp
      ? settings.smtp_secure
      : process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "ssl"
        ? "ssl"
        : process.env.SMTP_SECURE === "none"
          ? "none"
          : "tls"
    const isSecure = secureSetting === "ssl" || port === 465

    const fromEmail =
      (hasDbSmtp
        ? settings.smtp_from_email
        : process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM
      )?.trim() ||
      settings.admin_email ||
      user
    const fromName =
      (hasDbSmtp
        ? settings.smtp_from_name
        : process.env.SMTP_FROM_NAME
      )?.trim() ||
      settings.blogname ||
      "PressForge News"

    if (!host || !user || !pass) {
      console.warn(
        "SMTP credentials not configured in wp_options or .env. Email skipped."
      )
      return {
        success: false,
        error:
          "SMTP not configured. Please configure SMTP in Settings → Email & SMTP.",
      }
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      requireTLS: !isSecure && secureSetting !== "none",
      ignoreTLS: secureSetting === "none",
      disableFileAccess: true,
      disableUrlAccess: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
      },
    })

    const info = await transporter.sendMail({
      from: { name: fromName.replace(/[\r\n]/g, " "), address: fromEmail },
      to,
      subject: subject.replace(/[\r\n]/g, " "),
      text: text || "",
      html,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch {
    console.error("SMTP delivery failed")
    return {
      success: false,
      error: "Email delivery failed",
    }
  }
}

/**
 * Send notification to admin when a new post is published
 */
export async function sendNewPostNotification(
  postTitle: string,
  postUrl: string,
  authorName: string
): Promise<EmailSendResult> {
  try {
    const settings = await getSmtpSettings()

    if (settings.enable_new_post_notifications !== "1") {
      return {
        success: false,
        error: "New post notifications are disabled in settings.",
      }
    }

    const recipient = settings.admin_notification_email || settings.admin_email
    if (!recipient) {
      return {
        success: false,
        error: "Admin notification email is not configured.",
      }
    }

    const { getDefaultLanguage } = await import("@/services/language.service")
    const defaultLang = await getDefaultLanguage().catch(() => null)
    const direction = (defaultLang?.direction === "rtl" ? "rtl" : "ltr") as
      "rtl" | "ltr"

    const siteName = settings.blogname || "PressForge News"
    const subjectTemplate =
      settings.email_new_post_subject || "📰 New Story: {{postTitle}}"
    const subject = subjectTemplate
      .replace(/{{postTitle}}/g, postTitle)
      .replace(/{{siteName}}/g, siteName)
      .replace(/{{authorName}}/g, authorName)

    const safePostUrl = absoluteWebUrl(postUrl)
    if (!safePostUrl) throw new Error("Invalid notification URL")
    const html = newPostNotificationTemplate({
      postTitle: escapeEmailHtml(postTitle),
      postUrl: escapeEmailHtml(safePostUrl),
      authorName: escapeEmailHtml(authorName),
      siteName: escapeEmailHtml(siteName),
      heading: escapeEmailHtml(settings.email_new_post_heading),
      copyrightText: escapeEmailHtml(settings.email_footer_text),
      direction,
    })

    return await sendEmail({
      to: recipient,
      subject,
      html,
      text: `New post published: "${postTitle}" by ${authorName}. Read: ${postUrl}`,
    })
  } catch (error) {
    console.error("Error in sendNewPostNotification:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send notification",
    }
  }
}

/**
 * Send welcome email to a new newsletter subscriber
 */
export async function sendNewsletterWelcomeEmail(
  email: string,
  name?: string,
  locale?: string
): Promise<EmailSendResult> {
  try {
    const settings = await getSmtpSettings()
    if (settings.enable_newsletter_notifications !== "1")
      return {
        success: false,
        error: "Newsletter welcome emails are disabled.",
      }
    const language = await getEmailLanguage({ locale })
    const wording = localizedEmailTemplates(
      settings,
      language.code,
      language.defaultCode
    )
    const message = localizedEmail({
      kind: "welcome",
      ...language,
      name,
      subject: wording.email_welcome_subject,
      heading: wording.email_welcome_heading,
      body: wording.email_welcome_body,
      footer: wording.email_footer_text,
    })
    return await sendEmail({ to: email, ...message })
  } catch (error) {
    console.error("Error in sendNewsletterWelcomeEmail:", error)
    return { success: false, error: "Newsletter delivery failed" }
  }
}

/**
 * Send test email from Settings UI to verify SMTP connectivity
 */
export async function sendTestEmail(
  testEmailAddress: string,
  locale?: string
): Promise<EmailSendResult> {
  const language = await getEmailLanguage({ locale })
  return sendEmail({
    to: testEmailAddress,
    ...localizedEmail({ kind: "test", ...language }),
  })
}
