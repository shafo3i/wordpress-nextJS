# Dependency security update — 8 November 2026

## Scope

Updated Next.js and its lint configuration from 16.2.6 to 16.4.1, Better Auth from 1.7.3 to 1.7.7, Nodemailer to 10.1.4, TinyMCE to 8.9.3, and Zod to 4.6.6. These are targeted security updates, not a general upgrade to every latest release.

Updated Vitest to 5.0.3, selected Vite 8.2.4, and aligned Node type definitions with the Docker runtime's Node 24. Moved shadcn to development dependencies and updated it to 4.23.0. Refreshed compatible transitive versions of fast-uri, ip-address, brace-expansion, and systeminformation. React and Drizzle versions remain unchanged. No database migration is required for this dependency update.

## Audit results

The full pnpm audit initially reported 76 findings: 7 critical, 27 high, 34 moderate, and 8 low. After the update it reports two findings: one moderate and one low. The production-only audit reports zero findings. Audit results describe known package advisories, not proof that the application has no security bugs.

Remaining development-only findings:

- `shadcn > deepmerge`: low severity; no patched release was available in the audit. See [the advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). The generator is excluded from production dependencies.
- ESLint's TypeScript parser and shadcn's ts-morph chain use `minimatch` 10.2.6. The moderate advisory requires 11.0.1; the current parent range still requires version 10. Do not globally force version 11 without checking parent compatibility. See [the advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

Recheck these through supported parent releases. Do not use a blanket `pnpm audit --fix` or force cross-major overrides simply to clear the audit count.

## Deployment

Commit both package.json and pnpm-lock.yaml together. Docker uses frozen lockfile installs and excludes development dependencies from its runtime image. Upload storage and database contents are unaffected. Existing jsdom externalization and Sharp asset tracing remain in next.config.ts.

Deploying this update still requires pushing the changes and rebuilding the application. Local installation does not update Coolify or any other deployed instance.

## Checks

- Repository Vitest suite: 295 passed, 11 skipped.
- TypeScript: `pnpm exec tsc --noEmit` passed.
- Persistent upload server: all five Node tests passed, including files added after startup and traversal/symlink protection.
- English and Arabic auth browser checks passed, including reset validation and MFA redirects; all auth requests were intercepted and no emails were sent.
- Arabic `/` and English `/en` homepage browser checks passed, including text direction and home navigation.
- Sharp native encoding, server HTML sanitization, and targeted ESLint checks passed.
- Full production webpack build passed in an isolated copy, including compilation, TypeScript, page-data collection, static generation, optimization, and build tracing. This used Docker's build command with a deliberately unreachable build-only database connection; fallback warnings during generation were expected. A Linux Docker image was not built locally.

The test configuration excludes ignored local build fixtures and nested node_modules directories, preventing third-party dependency tests from being mistaken for application tests.

The initial production verification in the full checkout was stopped after an unusually long compile. Next.js also reported a slow local filesystem. A clean copy excluding backups, ignored build fixtures, and uploaded media compiled in 72 seconds with the same dependencies and configuration. Keep these large local artifacts out of Docker build contexts as already specified by `.dockerignore`.
