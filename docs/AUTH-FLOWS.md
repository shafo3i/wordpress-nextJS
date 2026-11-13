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

New sessions last eight hours, renew every five minutes while active, and have a 30-minute freshness window. Existing persisted sessions are not mass-revoked by this deployment. Login, reset requests and verification-email requests have database-backed rate limits, alongside the plugins' own limits. The unsupported `accountLocking` configuration was removed; it was not implementing an account lock in this installed version.

Authentication emails use the site's default language and the existing Settings → Email & SMTP configuration, with environment SMTP as its existing fallback. Delivery failures now fail the auth mail request rather than silently succeeding. No new package or database migration is required.

Settings logo labels were repaired in the Arabic template. Translation resolution ignores placeholder-damaged database overrides, including mixed text such as `PNG ?? JPEG`, allowing the valid template to show while retaining readable custom overrides.

## User and role administration security pass (11 November 2026)

Users and custom roles are now administrator-only at the page, query, action and service boundaries. Editors cannot list private account information or manage accounts. Mutations recheck the acting administrator against the database inside a transaction. The unused generic Better Auth admin HTTP endpoints are blocked in the auth route, so they cannot bypass CMS validation, self-account protection, administrator availability checks or session invalidation. Ordinary login, recovery, profile and MFA endpoints remain available.

Editors can create and edit posts, manage media (upload, edit shared details and delete), and create, edit and delete tags. Categories are visible and selectable but category creation, edits and deletion remain administrator-only at action and service boundaries. The category list hides mutation controls for editors. Other admin modules remain administrator-only. Editors cannot trash, restore or delete posts. Administrative modules retain the administrator guard; approved editorial entry points explicitly use `verifyPostEditor`. Layout access, navigation and server actions enforce the same policy. Media authentication guards execute outside error handlers so Next.js redirects propagate normally.

Inputs use the shared `db/schema/cms-users.ts` runtime schemas. Roles must be registered single identifiers, batches are bounded and deduplicated, and unknown fields such as `twoFactorEnabled` are rejected. User queries select explicit fields and use AND when combining a search with a role filter. Custom roles are labels rather than a capability editor; they cannot shadow system roles or be deleted while assigned to users.

Administrators cannot delete, ban, unverify or demote themselves here, and mutations preserve a usable administrator. Related changes share a transaction and serialize with a transaction-scoped advisory lock. Name-only edits preserve MFA, image and omitted ban fields. Password, role, email and ban changes revoke affected sessions and previously issued password reset tokens. Password resets preserve MFA enrollment and recovery codes.

Account creation stores the user and credential together using Better Auth's compatible password hashing, with the existing breached-password check retained. Generated passwords use Web Crypto, and credential operations have a database-backed per-administrator quota. Creation/reset responses expose only the identifier and the intentionally displayed one-time password needed by the administrator, not full account records. Passwords are not emailed: the notification uses the existing localized, escaped, expiring password reset link. Delivery failure reports a warning after the account change is saved.

Verification uses mocked database transactions, actual Better Auth password verification and isolated in-memory public auth endpoints, plus browser fixtures for English/Arabic dialogs and safe role-label rendering. It does not modify live accounts, send real mail or verify PostgreSQL transaction behavior against the deployed database. No schema migration or account reseeding is required. This pass does not establish that other admin modules or the full site are secure.

## Earlier authentication verification

`tests/unit/lib/auth-flows.test.ts` exercises actual Better Auth endpoints using isolated in-memory accounts and intercepted mail. It covers enrollment, pending sessions, wrong/valid codes, single-use recovery codes, expired challenges, passwordless MFA enforcement, reset expiry/reuse/session revocation, verification without auto-login, and disabled passwordless signup. Navigation and email tests cover unsafe redirect rejection, localized email HTML escaping and SMTP failure handling.

`tests/verification/verify-auth-browser.ts` checks both UI languages and directions, recovery links, empty login fields, password confirmation and MFA redirects. Browser auth API calls are intercepted, so this script does not send live mail or alter real users. SMTP delivery to a real inbox is not covered by these checks.

## Profile security pass (13 November 2026)

The administrative Profile page remains administrator-only. Self-update endpoints accept only bounded name/image inputs. Password changes require the current password, validate the new password at 12-128 characters, and enforce other-session revocation on the server. These rules are shared by HTTP and internal Better Auth calls. Displayed MFA status is refreshed from the server, and sensitive dialogs clear on close. Unsupported phone, per-user notification and passkey controls no longer claim to persist changes. See the site security plan for coverage and deployment limitations.
