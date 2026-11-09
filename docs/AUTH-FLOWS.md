# Account access and recovery

Both `/cms-admin` and `/cms-login` start with empty email/password inputs. They link to:

- `/forgot-password`: request a reset link.
- `/password-reset`: set a new password using the emailed token.
- `/magic-link`: request a one-use login link, or explicitly continue from an emailed link.
- `/email-otp`: request and enter an email login code.
- `/verify-email`: resend account verification mail.
- `/email-verified`: return page after verifying an email address.
- `/verify-2fa`: enter an authenticator or recovery code after the first sign-in step.

Shared components under `components/auth` use the existing site/admin styling and translation dictionaries. Signup uses the same shell and waits for email verification rather than suggesting that registration created an authenticated session. Registration restrictions remain enforced on the server; passwordless login cannot create new accounts.

## Two-factor authentication

Users enroll through their profile's existing two-factor settings using manual key entry in their authenticator app (time-based TOTP, six digits, 30 seconds). Enrollment requires a password and a valid authenticator code. Merely opening the setup dialog does not enable 2FA. Recovery codes should be saved privately; each can be used once. Setup no longer automatically trusts the browser. Trust is an explicit choice on the login challenge screen.

The previous QR image requested `api.qrserver.com` with the full authenticator URI, disclosing the setup secret to that external service. That request was removed; setup uses manual entry without a new QR dependency. Users who enrolled through the old QR screen should re-enroll to replace that secret. This deployment does not change anyone's MFA state or secret automatically.

The login form checks Better Auth's `twoFactorRedirect` response before navigating to the requested destination. `lib/auth-two-factor.ts` extends the installed plugin's existing challenge handler to magic-link and email-code sign-in as well. This retains the library's signed challenge cookies, session removal, expiry, attempts handling and trusted-browser checks. Email verification does not automatically sign a user in, avoiding a separate way around MFA. A password reset leaves MFA enabled.

## Security and delivery

Redirects are restricted to local application paths. Auth pages use no-referrer metadata and are excluded from indexing. Magic links require an explicit button click rather than being consumed automatically during page render. Magic tokens are stored hashed and expire after five minutes. Password reset links expire after one hour and a successful reset revokes sessions. The installed library expects seconds for these settings; the previous millisecond values were incorrect.

New sessions last one hour, with a 30-minute freshness window. Existing persisted sessions are not mass-revoked by this deployment. Login, reset requests and verification-email requests have database-backed rate limits, alongside the plugins' own limits. The unsupported `accountLocking` configuration was removed; it was not implementing an account lock in this installed version.

Authentication emails use the site's default language and the existing Settings → Email & SMTP configuration, with environment SMTP as its existing fallback. Delivery failures now fail the auth mail request rather than silently succeeding. No new package or database migration is required.

Settings logo labels were repaired in the Arabic template. Translation resolution ignores placeholder-damaged database overrides, including mixed text such as `PNG ?? JPEG`, allowing the valid template to show while retaining readable custom overrides.

## Verification

`tests/unit/lib/auth-flows.test.ts` exercises actual Better Auth endpoints using isolated in-memory accounts and intercepted mail. It covers enrollment, pending sessions, wrong/valid codes, single-use recovery codes, expired challenges, passwordless MFA enforcement, reset expiry/reuse/session revocation, verification without auto-login, and disabled passwordless signup. Navigation and email tests cover unsafe redirect rejection, localized email HTML escaping and SMTP failure handling.

`tests/verification/verify-auth-browser.ts` checks both UI languages and directions, recovery links, empty login fields, password confirmation and MFA redirects. Browser auth API calls are intercepted, so this script does not send live mail or alter real users. SMTP delivery to a real inbox is not covered by these checks.
