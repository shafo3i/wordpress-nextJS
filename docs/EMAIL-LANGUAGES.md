# Arabic and English email

## Choosing the language

Authentication senders now resolve an active language from an explicit server hint, the request's locale header, the language in the email/callback URL, or the visitor's `site_lang` cookie. They then fall back to the configured site language. `admin_lang` does not control email language.

Password-reset, verification, magic-link, OTP, and existing-account security messages use translated subject/body/button/footer wording. The localized publication name is used when configured. Links retain their tokens and include the resolved language so opening a message on another device preserves the interface language. OTP values and authentication/MFA checks are unchanged.

Server-initiated sends without a request or language hint use the site default. A persistent per-user authentication-email preference has not been added.

Newsletter forms send their language to the subscription endpoint. The validated active language is stored with new subscriber records in the existing newsletter options JSON and passed to the welcome sender. Existing subscribers are not overwritten or sent another welcome message by a repeated subscription request. Old records without a locale remain compatible.

## Editing wording

In **Settings > Email & Notifications > Email template language**, choose Arabic or English and edit the newsletter subject, heading, body, and footer. The test-email button uses that selection, with shared SMTP credentials.

- Default-language authored wording is preserved in the existing fields.
- Other languages use `email_template_translations` in the existing options table.
- Missing wording uses translated built-in copy, never another language's authored newsletter text.
- Supported text variables are `{{siteName}}` and `{{name}}`; footer text also supports `{{year}}`.
- Custom wording is plain text. Dynamic values are escaped for HTML; raw scripts and markup are not executed.
- Authentication wording is managed through **Languages > Translations**, using the `mail.reset.*`, `mail.verify.*`, `mail.magic.*`, `mail.otp.*`, and `mail.existing.*` keys. Common footer/name wording uses the other `mail.*` keys.

Test-email wording uses `mail.test.*`. SMTP delivery failures continue to return failure. No SMTP credentials are duplicated by language.

No seed, table migration, or resend of existing messages is needed. New options are created when saved. Deployment is required for runtime changes to take effect.

## Verification

Tests in `tests/unit/lib/auth-email.test.ts`, `tests/unit/lib/email-delivery-language.test.ts`, and `tests/unit/app/api/newsletter/subscribe/route.test.ts` intercept delivery. They cover both directions, token/language preservation, safe HTML, invalid language fallback, separate newsletter overrides, stored subscription language, duplicate suppression, and SMTP failure reporting.

`tests/settings-identity.browser.spec.ts` verifies that changing English newsletter wording preserves the default-language text in both admin directions. No real email was sent during automated verification. Actual inbox delivery can be checked using the Settings test-email button with an address you control.
