/**
 * Centralized Transactional Email Templates System
 * High-deliverability HTML email templates with dynamic RTL / LTR direction support,
 * custom wording overrides, and strict inline styles for Gmail, Outlook, Apple Mail, and Webmail.
 */

export interface EmailLayoutOptions {
  footerNote?: string;
  copyrightText?: string;
  direction?: "rtl" | "ltr";
}

/**
 * Base layout wrapper for all transactional emails
 */
export function emailLayout(content: string, siteName: string, options?: EmailLayoutOptions): string {
  const isRtl = options?.direction === "rtl";
  const currentYear = new Date().getFullYear();
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";
  const lang = isRtl ? "ar" : "en";

  const defaultFooterNote = isRtl
    ? `هذه رسالة آلية صادرة من <strong>${siteName}</strong>.`
    : `This is an automated message from <strong>${siteName}</strong>.`;

  const defaultCopyright = isRtl
    ? `جميع الحقوق محفوظة © ${currentYear} ${siteName}.`
    : `© ${currentYear} ${siteName}. All rights reserved.`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="${dir}" lang="${lang}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${siteName}</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body, div, table, td, p, h1, h2, h3, span {
      direction: ${dir} !important;
      text-align: ${align} !important;
    }
    .center-btn {
      text-align: center !important;
    }
  </style>
</head>
<body dir="${dir}" style="margin: 0; padding: 25px 10px; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif; direction: ${dir} !important; text-align: ${align} !important; -webkit-font-smoothing: antialiased;">
  <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; width: 100%; margin: 0; padding: 0;">
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction: ${dir} !important; text-align: ${align} !important; background-color: #f4f5f7; width: 100%;">
      <tr>
        <td dir="${dir}" align="center" style="direction: ${dir} !important; text-align: center !important; padding: 10px 0;">
          <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction: ${dir} !important; text-align: ${align} !important; max-width: 540px; width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 auto;">
            <!-- Header -->
            <tr>
              <td dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; padding: 20px 24px; border-bottom: 1px solid #f3f4f6; background-color: #ffffff;">
                <h1 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 18px; font-weight: bold; color: #111827; margin: 0; padding: 0;">
                  ${siteName}
                </h1>
              </td>
            </tr>

            <!-- Main Content -->
            <tr>
              <td dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; padding: 28px 24px; font-size: 14px; line-height: 1.8; color: #374151;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; padding: 16px 24px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; font-size: 12px; color: #6b7280; line-height: 1.6;">
                <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 4px 0;">
                  ${options?.footerNote || defaultFooterNote}
                </p>
                <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0; color: #9ca3af;">
                  ${options?.copyrightText || defaultCopyright}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * 1. Password reset email template
 */
export function passwordResetTemplate(
  name: string,
  directResetLink: string,
  siteName: string,
  options?: {
    heading?: string;
    bodyText?: string;
    buttonText?: string;
    copyrightText?: string;
    direction?: "rtl" | "ltr";
  }
): string {
  const isRtl = options?.direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "طلب إعادة تعيين كلمة المرور" : "Password Reset Request";
  const greeting = isRtl ? `مرحباً <strong>${name || "عزيزنا المستخدم"}</strong>،` : `Hello <strong>${name || "User"}</strong>,`;
  const defaultBody = isRtl
    ? `تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في <strong>${siteName}</strong>. يمكنك تعيين كلمة مرور جديدة بالضغط على الزر أدناه:`
    : `We received a request to reset the password for your account on <strong>${siteName}</strong>. Click the button below to set a new password:`;
  const btnLabel = options?.buttonText || (isRtl ? "إعادة تعيين كلمة المرور" : "Reset Password");
  const expiryNote = isRtl
    ? "⏳ تنتهي صلاحية هذا الرابط خلال <strong>60 دقيقة</strong>. إذا لم تكن قد طلبت تغيير كلمة المرور، يمكنك تجاهل هذه الرسالة."
    : "⏳ This link expires in <strong>60 minutes</strong>. If you did not request a password reset, you can safely ignore this email.";
  const fallbackHint = isRtl
    ? "إذا واجهت مشكلة في الضغط على الزر، انسخ الرابط التالي والصقه في متصفحك:"
    : "If you have trouble clicking the button, copy and paste the URL below into your web browser:";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 16px 0;">
      ${options?.heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${greeting}
    </p>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${options?.bodyText || defaultBody}
    </p>

    <!-- Action Button Table -->
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 26px 0;">
      <tr>
        <td dir="${dir}" align="center" style="text-align: center !important;">
          <a href="${directResetLink}" dir="${dir}" style="display: inline-block; background-color: #1d2327; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center;">
            ${btnLabel}
          </a>
        </td>
      </tr>
    </table>

    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
      ${expiryNote}
    </p>

    <!-- Fallback Link -->
    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; border-top: 1px solid #f3f4f6; margin-top: 20px; padding-top: 14px;">
      <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 6px 0; font-size: 11px; color: #9ca3af;">
        ${fallbackHint}
      </p>
      <div dir="ltr" align="left" style="direction: ltr !important; text-align: left !important; font-family: monospace, sans-serif; font-size: 11px; color: #2563eb; word-break: break-all;">
        ${directResetLink}
      </div>
    </div>
  `, siteName, { copyrightText: options?.copyrightText, direction: options?.direction });
}

/**
 * 2. Email verification template
 */
export function verifyEmailTemplate(
  name: string,
  verificationLink: string,
  siteName: string,
  options?: {
    heading?: string;
    bodyText?: string;
    buttonText?: string;
    copyrightText?: string;
    direction?: "rtl" | "ltr";
  }
): string {
  const isRtl = options?.direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "تأكيد عنوان بريدك الإلكتروني" : "Verify Your Email Address";
  const greeting = isRtl ? `مرحباً <strong>${name || "عزيزنا المستخدم"}</strong>،` : `Hello <strong>${name || "User"}</strong>,`;
  const defaultBody = isRtl
    ? `شكراً لانضمامك إلى <strong>${siteName}</strong>. يُرجى تأكيد بريدك الإلكتروني لتفعيل حسابك بالكامل عبر الضغط على الزر أدناه:`
    : `Thank you for joining <strong>${siteName}</strong>. Please confirm your email address to activate your account by clicking the button below:`;
  const btnLabel = options?.buttonText || (isRtl ? "تأكيد البريد الإلكتروني" : "Verify Email");
  const ignoreNote = isRtl
    ? "إذا لم تكن أنت من قام بإنشاء هذا الحساب، فلا داعي لاتخاذ أي إجراء."
    : "If you did not create this account, no further action is required.";
  const fallbackHint = isRtl
    ? "إذا لم يعمل الزر معك، يمكنك نسخ الرابط التالي ولصقه في المتصفح:"
    : "If the button does not work, copy and paste the following link into your browser:";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 16px 0;">
      ${options?.heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${greeting}
    </p>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${options?.bodyText || defaultBody}
    </p>

    <!-- Action Button Table -->
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 26px 0;">
      <tr>
        <td dir="${dir}" align="center" style="text-align: center !important;">
          <a href="${verificationLink}" dir="${dir}" style="display: inline-block; background-color: #1d2327; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center;">
            ${btnLabel}
          </a>
        </td>
      </tr>
    </table>

    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
      ${ignoreNote}
    </p>

    <!-- Fallback Link -->
    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; border-top: 1px solid #f3f4f6; margin-top: 20px; padding-top: 14px;">
      <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 6px 0; font-size: 11px; color: #9ca3af;">
        ${fallbackHint}
      </p>
      <div dir="ltr" align="left" style="direction: ltr !important; text-align: left !important; font-family: monospace, sans-serif; font-size: 11px; color: #2563eb; word-break: break-all;">
        ${verificationLink}
      </div>
    </div>
  `, siteName, { copyrightText: options?.copyrightText, direction: options?.direction });
}

/**
 * 3. Email OTP Code template
 */
export function emailOtpTemplate(
  otp: string,
  type: string,
  siteName: string,
  options?: {
    heading?: string;
    copyrightText?: string;
    direction?: "rtl" | "ltr";
  }
): string {
  const isRtl = options?.direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const actionLabel = isRtl
    ? (type === "sign-in" ? "تسجيل الدخول" : type === "email-verification" ? "تأكيد البريد الإلكتروني" : "المصادقة والتحقق")
    : (type === "sign-in" ? "Sign In" : type === "email-verification" ? "Email Verification" : "Authentication");

  const defaultHeading = isRtl ? "رمز التحقق الخاص بك" : "Your Verification Code";
  const instruction = isRtl
    ? `استخدم الرمز التالي لإتمام عملية <strong>${actionLabel}</strong> في <strong>${siteName}</strong>:`
    : `Use the following one-time code to complete <strong>${actionLabel}</strong> on <strong>${siteName}</strong>:`;
  const expiryNote = isRtl
    ? "⏳ هذا الرمز صالح للاستخدام لمدة <strong>5 دقائق</strong> فقط. لدواعي الأمان، يُرجى عدم مشاركة هذا الرمز مع أي شخص."
    : "⏳ This code is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone.";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 16px 0;">
      ${options?.heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${instruction}
    </p>

    <!-- OTP Display Box Table -->
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td dir="${dir}" align="center" style="text-align: center !important;">
          <div style="display: inline-block; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 28px;">
            <span dir="ltr" style="font-family: monospace, sans-serif; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; direction: ltr; display: inline-block;">
              ${otp}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
      ${expiryNote}
    </p>
  `, siteName, { copyrightText: options?.copyrightText, direction: options?.direction });
}

/**
 * 4. Password changed confirmation template
 */
export function passwordChangedTemplate(
  name: string,
  siteName: string,
  options?: {
    heading?: string;
    copyrightText?: string;
    direction?: "rtl" | "ltr";
  }
): string {
  const isRtl = options?.direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "تنبيه أمان: تم تحديث كلمة المرور" : "Security Notice: Password Updated";
  const greeting = isRtl ? `مرحباً <strong>${name || "عزيزنا المستخدم"}</strong>،` : `Hello <strong>${name || "User"}</strong>,`;
  const infoText = isRtl
    ? `نود إشعارك بأنه تم تغيير كلمة المرور الخاصة بحسابك في <strong>${siteName}</strong> بنجاح.`
    : `This is a confirmation that the password for your account on <strong>${siteName}</strong> has been successfully changed.`;
  const securityWarning = isRtl
    ? "<strong>هل لم تقم بهذا التغيير؟</strong> إذا لم تكن أنت من قام بهذا الإجراء، يُرجى التواصل فوراً مع إدارة المنصة أو استعادة كلمة المرور لتأمين حسابك."
    : "<strong>Didn't request this change?</strong> If you did not make this change, please contact support immediately or reset your password to secure your account.";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 16px 0;">
      ${options?.heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${greeting}
    </p>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${infoText}
    </p>

    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 14px; margin: 18px 0;">
      <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 12.5px; color: #92400e; margin: 0; line-height: 1.6;">
        ${securityWarning}
      </p>
    </div>
  `, siteName, { copyrightText: options?.copyrightText, direction: options?.direction });
}

/**
 * 5. Magic login link template
 */
export function magicLinkTemplate(
  url: string,
  siteName: string,
  options?: {
    heading?: string;
    buttonText?: string;
    copyrightText?: string;
    direction?: "rtl" | "ltr";
  }
): string {
  const isRtl = options?.direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "تسجيل الدخول المباشر" : "Instant Sign-In Link";
  const introText = isRtl
    ? `انقر على الزر أدناه لتسجيل الدخول مباشرة إلى حسابك في <strong>${siteName}</strong> دون الحاجة لكلمة مرور:`
    : `Click the button below to sign in directly to your account on <strong>${siteName}</strong> without entering a password:`;
  const btnLabel = options?.buttonText || (isRtl ? `تسجيل الدخول إلى ${siteName}` : `Sign In to ${siteName}`);
  const expiryNote = isRtl
    ? "⏳ هذا الرابط الآمن صالح للاستخدام لمرة واحدة فقط وينتهي خلال <strong>10 دقائق</strong>."
    : "⏳ This secure link can only be used once and expires in <strong>10 minutes</strong>.";
  const fallbackHint = isRtl
    ? "إذا واجهتك مشكلة في الزر، يمكنك نسخ هذا الرابط ولصقه في المتصفح:"
    : "If the button does not work, copy and paste this link into your browser:";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 18px; font-weight: bold; color: #111827; margin: 0 0 16px 0;">
      ${options?.heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 20px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${introText}
    </p>

    <!-- Action Button Table -->
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 26px 0;">
      <tr>
        <td dir="${dir}" align="center" style="text-align: center !important;">
          <a href="${url}" dir="${dir}" style="display: inline-block; background-color: #1d2327; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center;">
            ${btnLabel}
          </a>
        </td>
      </tr>
    </table>

    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
      ${expiryNote}
    </p>

    <!-- Fallback Link -->
    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; border-top: 1px solid #f3f4f6; margin-top: 20px; padding-top: 14px;">
      <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 6px 0; font-size: 11px; color: #9ca3af;">
        ${fallbackHint}
      </p>
      <div dir="ltr" align="left" style="direction: ltr !important; text-align: left !important; font-family: monospace, sans-serif; font-size: 11px; color: #2563eb; word-break: break-all;">
        ${url}
      </div>
    </div>
  `, siteName, { copyrightText: options?.copyrightText, direction: options?.direction });
}

/**
 * 6. SMS OTP message template
 */
export function otpSmsTemplate(code: string, siteName: string, isRtl = false): string {
  return isRtl
    ? `[${siteName}] رمز التحقق الخاص بك هو: ${code}. صالح لمدة 5 دقائق.`
    : `[${siteName}] Your verification code is: ${code}. Valid for 5 minutes.`;
}

/**
 * 7. New post notification email template for admins (Configurable Wording & Direction)
 */
export function newPostNotificationTemplate({
  postTitle,
  postUrl,
  authorName,
  siteName = "PressForge News",
  heading,
  buttonText,
  copyrightText,
  direction = "ltr",
}: {
  postTitle: string;
  postUrl: string;
  authorName: string;
  siteName?: string;
  heading?: string;
  buttonText?: string;
  copyrightText?: string;
  direction?: "rtl" | "ltr";
}): string {
  const isRtl = direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "إشعار نشر مقال جديد" : "New Story Published";
  const introText = isRtl ? "تم نشر مادة صحفية جديدة على الموقع:" : "A new story has just been published:";
  const authorLabel = isRtl ? "الكاتب:" : "Author:";
  const btnLabel = buttonText || (isRtl ? "عرض المقال على الموقع" : "Read Story on Site");
  const footerHint = isRtl
    ? "يمكنك مراجعة المقال وإدارته من لوحة التحكم في أي وقت."
    : "You can review and manage this story from the admin dashboard.";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #111827;">
      ${heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 14px 0; font-size: 14px; color: #374151;">
      ${introText}
    </p>
    
    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 16px; font-weight: bold; color: #111827; margin: 16px 0; padding: 14px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
      ${postTitle}
    </div>

    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 18px 0; font-size: 14px; color: #374151;">
      <strong>${authorLabel}</strong> ${authorName}
    </p>

    <!-- Action Button Table -->
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td dir="${dir}" align="center" style="text-align: center !important;">
          <a href="${postUrl}" dir="${dir}" style="display: inline-block; background-color: #1d2327; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; text-align: center;">
            ${btnLabel}
          </a>
        </td>
      </tr>
    </table>

    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; color: #6b7280; font-size: 12px; margin: 0;">
      ${footerHint}
    </p>
  `, siteName, { copyrightText, direction });
}

/**
 * 8. Newsletter welcome email template (Configurable Wording & Direction)
 */
export function newsletterWelcomeTemplate({
  siteName = "PressForge News",
  name,
  heading,
  bodyText,
  copyrightText,
  direction = "ltr",
}: {
  siteName?: string;
  name?: string;
  heading?: string;
  bodyText?: string;
  copyrightText?: string;
  direction?: "rtl" | "ltr";
}): string {
  const isRtl = direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultGreeting = isRtl
    ? `مرحباً ${name || "عزيزنا القارئ"}،`
    : `Hello ${name || "Reader"},`;

  const defaultHeading = isRtl ? "أهلاً بك في النشرة البريدية" : "Welcome to Our Newsletter";
  const defaultBody = isRtl
    ? `شكراً لاشتراكك في النشرة البريدية لـ <strong>${siteName}</strong>. سنقوم بموافاتك بأحدث الأخبار والتقارير والتحليلات مباشرة إلى بريدك الإلكتروني.`
    : `Thank you for subscribing to <strong>${siteName}</strong>. You will receive our top editorial stories, investigative dispatches, and breaking alerts directly in your inbox.`;

  const footerUnsubscribe = isRtl
    ? "يمكنك إلغاء الاشتراك في أي وقت عبر الرابط الموجود في أسفل الرسائل."
    : "You can unsubscribe at any time using the link at the bottom of our emails.";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #111827;">
      ${heading || defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-size: 15px; font-weight: bold; color: #111827; margin: 0 0 14px 0;">
      ${defaultGreeting}
    </p>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 18px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${bodyText || defaultBody}
    </p>
  `, siteName, {
    copyrightText,
    footerNote: footerUnsubscribe,
    direction,
  });
}

/**
 * 9. SMTP configuration test email template (Configurable Wording & Direction)
 */
export function testEmailTemplate({
  siteName = "PressForge News",
  heading,
  bodyText,
  copyrightText,
  direction = "ltr",
}: {
  siteName?: string;
  heading?: string;
  bodyText?: string;
  copyrightText?: string;
  direction?: "rtl" | "ltr";
}): string {
  const isRtl = direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "اختبار إعدادات البريد الإلكتروني" : "SMTP Configuration Test";
  const successBadge = isRtl ? "✓ تم الاتصال بخادم البريد (SMTP) بنجاح تام!" : "✓ SMTP Mail Server Connected Successfully!";
  const defaultBody = isRtl
    ? "وصول هذه الرسالة يؤكد أن إعدادات خادم البريد صحيحة وأن نظام الإشعارات والمصادقة في المنصة جاهز للعمل."
    : "Receiving this email confirms your SMTP server settings are correctly configured and ready to dispatch notifications.";

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">
      ${heading || defaultHeading}
    </h2>
    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin: 16px 0; color: #166534; font-weight: bold; font-size: 14px;">
      ${successBadge}
    </div>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0 0 16px 0;">
      ${bodyText || defaultBody}
    </p>
  `, siteName, { copyrightText, direction });
}

/**
 * 10. Security Alert: Duplicate signup attempt notification template
 */
export function existingAccountAlertTemplate({
  name,
  siteName,
  ipAddress,
  userAgent,
  timestamp,
  loginUrl,
  resetPasswordUrl,
  copyrightText,
  direction = "ltr",
}: {
  name?: string;
  siteName: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  loginUrl?: string;
  resetPasswordUrl?: string;
  copyrightText?: string;
  direction?: "rtl" | "ltr";
}): string {
  const isRtl = direction === "rtl";
  const align = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  const defaultHeading = isRtl ? "تنبيه أمان: محاولة تسجيل جديدة" : "Security Notice: Duplicate Registration Attempt";
  const greeting = isRtl ? `مرحباً ${name || "عزيزنا المستخدم"}،` : `Hello ${name || "User"},`;
  const introText = isRtl
    ? `تم رصد محاولة لإنشاء حساب جديد في <strong>${siteName}</strong> باستخدام عنوان بريدك الإلكتروني هذا.`
    : `An attempt was made to register a new account on <strong>${siteName}</strong> using your email address.`;
  const ipLabel = isRtl ? "عنوان IP:" : "IP Address:";
  const timeLabel = isRtl ? "التوقيت:" : "Timestamp:";
  const safeNotice = isRtl
    ? "<strong>حسابك الحالي محمي وآمن:</strong><br/>لم يتم إنشاء أي حساب جديد ولم تتغير كلمة مرورك أو بياناتك. إذا لم تكن أنت من قام بالمحاولة، يمكنك تجاهل هذه الرسالة بأمان."
    : "<strong>Your existing account remains secure:</strong><br/>No new account was created and your password was not changed. If you did not make this attempt, you can safely disregard this notice.";
  const loginBtn = isRtl ? "تسجيل الدخول إلى حسابك" : "Sign In to Your Account";
  const forgotPwd = isRtl ? "هل نسيت كلمة المرور؟ انقر هنا لاستعادتها" : "Forgot your password? Click here to reset it";

  const formattedTime =
    timestamp ||
    new Date().toLocaleString(isRtl ? "ar-SA" : "en-US", {
      timeZone: "UTC",
      dateStyle: "full",
      timeStyle: "short",
    });

  return emailLayout(`
    <h2 dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #111827;">
      ${defaultHeading}
    </h2>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; font-weight: bold; color: #111827; margin: 0 0 12px 0;">
      ${greeting}
    </p>
    <p dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; margin: 0 0 16px 0; font-size: 14px; line-height: 1.8; color: #374151;">
      ${introText}
    </p>

    <!-- Audit Details Table -->
    <table dir="${dir}" align="${align}" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction: ${dir} !important; text-align: ${align} !important; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px;">
      <tr>
        <td dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; padding: 4px 0; color: #6b7280; font-weight: bold;">${ipLabel}</td>
        <td dir="ltr" align="left" style="direction: ltr !important; text-align: left !important; padding: 4px 0; font-family: monospace; color: #111827;">${ipAddress || "N/A"}</td>
      </tr>
      <tr>
        <td dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; padding: 4px 0; color: #6b7280; font-weight: bold;">${timeLabel}</td>
        <td dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; padding: 4px 0; color: #111827;">${formattedTime}</td>
      </tr>
    </table>

    <!-- Safe Notice -->
    <div dir="${dir}" align="${align}" style="direction: ${dir} !important; text-align: ${align} !important; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px; margin: 18px 0; font-size: 13px; color: #166534; line-height: 1.6;">
      ${safeNotice}
    </div>

    <!-- Action Button Table -->
    <table dir="${dir}" align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td dir="${dir}" align="center" style="text-align: center !important;">
          <a href="${loginUrl || "#"}" dir="${dir}" style="display: inline-block; background-color: #1d2327; color: #ffffff !important; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; text-align: center;">
            ${loginBtn}
          </a>
        </td>
      </tr>
    </table>

    ${resetPasswordUrl ? `
      <div dir="${dir}" align="center" style="direction: ${dir} !important; text-align: center !important; margin-top: 10px;">
        <a href="${resetPasswordUrl}" dir="${dir}" style="font-size: 12px; color: #2563eb; text-decoration: underline;">
          ${forgotPwd}
        </a>
      </div>
    ` : ""}
  `, siteName, {
    copyrightText,
    footerNote: isRtl
      ? "رسالة أمان آلية تم إرسالها لحماية خصوصية وأمان حسابك."
      : "Automated security alert dispatched to protect your account safety.",
    direction,
  });
}
