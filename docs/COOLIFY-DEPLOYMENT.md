# Coolify: application and PgBouncer

This configuration uses the existing, migrated Coolify PostgreSQL database. It creates only an application container, a PgBouncer container and a persistent uploads volume. It does not initialize, reset, seed or migrate PostgreSQL on startup.

```text
Coolify HTTPS proxy → app:3000 → pgbouncer:6432 → existing PostgreSQL:5432
```

## Create the application resource

1. Open the same Coolify server/destination that hosts the running PostgreSQL resource. Open that database and copy its **Postgres URL (internal)**. Extract its hostname, username, password, database name and port. A container's `localhost` means that container itself; use the internal database hostname instead.
2. Add an application from the Git repository and choose the **Docker Compose** build pack. If the repository root contains this project, use `/` as the base directory. If the project is under `news/` in Git, use `/news` instead. `Dockerfile` and `compose.yaml` are relative to the project directory.
3. Set the Compose file location to `/compose.yaml` relative to that base directory and load the Compose configuration.
4. Under **Advanced → Docker compose → Predefined network**, enable **Connect to predefined network**. The Compose resource needs this to reach the separately managed PostgreSQL resource. Merely placing resources in the same project/environment does not establish shared-network connectivity.
5. Add the variables below in Coolify. Mark passwords, authentication secrets and credential-containing URLs as secrets. Keep secrets runtime-only; the only application build argument is the public URL.
6. Assign the public domain to the **app** service on internal port **3000**. Do not assign a domain or published host port to PgBouncer.
7. Deploy. Both containers run from this one Compose resource; no additional PgBouncer resource is needed.

## Environment variables

| Variable              | Value                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Final public origin, e.g. `https://news.example.com`; available at build and runtime                |
| `BETTER_AUTH_SECRET`  | A private, randomly generated authentication secret, at least 32 characters; runtime only           |
| `ENCRYPTION_KEY`      | A stable private secret for encrypted settings; reuse the existing key if one is already configured |
| `DB_HOST`             | Existing PostgreSQL **internal hostname**, copied from Coolify                                      |
| `DB_PORT`             | Existing database's internal port, normally `5432`; not its public mapped port                      |
| `DB_NAME`             | Existing database name, currently `postgres`                                                        |
| `DB_USER`             | Existing PostgreSQL username                                                                        |
| `DB_PASSWORD`         | Existing PostgreSQL password, in its original unencoded form; runtime only                          |
| `APP_DATABASE_URL`    | `postgresql://ENCODED_USER:ENCODED_PASSWORD@pgbouncer:6432/postgres`; runtime only                  |
| `DB_POOL_MAX`         | `2` initially; the application's pool per Node process                                              |

Replace all example values. Percent-encode reserved characters in the username/password **inside `APP_DATABASE_URL`**; keep `DB_PASSWORD` unencoded. Never paste the full database URL or password into source control or logs. The Compose file maps `APP_DATABASE_URL` to the app's existing `DATABASE_URL` setting and derives `BETTER_AUTH_URL` from the public origin.

The public origin also sets `NEXT_PUBLIC_SITE_URL` for existing SEO/Open Graph code. Keep `ENCRYPTION_KEY` identical in environments sharing encrypted settings, and retain it across database password/hostname changes. The existing encryption code otherwise falls back to the database URL. If existing SMTP settings were encrypted using that fallback, re-save them with the intended stable key before relying on them through the pooled URL. These deployment files do not rewrite encrypted database values.

The `pgbouncer` hostname is the service alias inside this Compose stack. If deploying app and PgBouncer as separate resources instead, use the actual shared-network PgBouncer hostname in `APP_DATABASE_URL`; do not assume that alias exists across resources.

Optional SMTP environment settings used by the application can be added to the app service, or configure SMTP from the admin settings. Do not copy local `.env` into the image. Changing the public URL requires rebuilding because Next.js embeds public environment variables into browser bundles.

## Persistent media

The `uploads` named volume mounts at **`/app/public/uploads`**. The runtime application runs as the standard Node image user, UID/GID **1000:1000**.

After the first deployment, locate this stack's actual uploads volume in Coolify/Docker and transfer the **contents** of local `public/uploads` into it over SFTP/SSH/rsync. Preserve the year/month subdirectories. Do not create another nested `uploads/uploads` directory. Ensure transferred files are readable and directories writable by UID/GID 1000:1000. Back up this volume with the PostgreSQL database and retain it across deployments.

The migrated 4.9 GB library is intentionally excluded from the image and Git. Until the volume is populated, its media URLs will not work in the deployed app even though their database records exist.

## Pooling

PgBouncer uses SCRAM authentication and transaction pooling. This initial configuration allows 100 client connections while capping server connections to 10 for the configured database/user, with no reserve pool. Check these values against the PostgreSQL connection budget and other applications before increasing them. Multiple PgBouncer instances multiply the total backend budget.

Retain a separate direct database URL for deliberate maintenance and migration commands. Do not run the migration or demo seed scripts automatically during builds or container startup. PgBouncer reduces connection usage; caching and query performance remain separate concerns.

## Image contents and build

The Dockerfile pins the Node major to 24 and pnpm to 10.28.0, installs from the existing frozen lockfile, and runs `next build --webpack`. No project package versions are upgraded. The runtime contains the complete production dependency tree so Sharp/jsdom filesystem and native assets remain available, plus `.next`, `public`, templates and Next configuration. It runs Next's production request handler as a non-root user through `deploy/server.mjs`.

The Docker runtime handles `/uploads` before passing other requests to Next. This serves media created after startup without depending on Next's startup snapshot of public assets. It supports HEAD and byte-range requests, blocks dotfiles/quarantine paths, disallows executable/active file types such as HTML and SVG, and rejects paths or symlinks escaping the uploads volume. No changes to the upload database schema or admin workflow are required.

`scripts/` stays in Git for maintenance, but `.dockerignore` excludes it from the build context. Backups, docs, tests, `.local`, `.env`, local dependencies and migrated uploads are also excluded. The final image copies only explicit runtime paths. Build-time database/authentication placeholders are not real credentials and are not copied as runtime environment settings.

For a local build with Docker Engine running:

```powershell
docker build --build-arg NEXT_PUBLIC_APP_URL=https://news.example.com -t pressforge:local .
```

For configuration validation, supply the variables above through a private environment file and run `docker compose --env-file YOUR_PRIVATE_ENV_FILE config --quiet`. Avoid printing rendered configuration because it contains secrets.

The upload runtime can be checked separately with `node --test tests/node/deploy/uploads.test.mjs`. Its test files are excluded from the Docker build context.

## Deployment checks

Check both container health statuses, `/`, `/ar`, admin sign-in, Pages/Posts/Media/Settings, a migrated article image, and a new upload. Redeploy once and confirm that the uploaded file persists. Set Site Address in admin settings to the deployed public URL; imported local settings may still contain `http://localhost:3000`.

## GitHub Actions builds and Coolify pulls the image

The workflow is `.github/workflows/ci-cd.yml`. On pull requests it runs checks only. On pushes to `main` (or a manual run on `main`), checks must succeed before GitHub builds the existing Dockerfile, publishes the image and calls the Coolify deploy webhook. Tests use dummy credentials, not the deployed database. No database reset, seed or migration is run.

The checks include TypeScript, the unit/security regression suite with two workers, upload-serving tests, a production dependency audit that blocks high/critical advisories, and selected isolated browser smoke tests. This is not a claim that the remaining security-plan work or every browser workflow has been audited. The image build is also a release gate. A webhook success means deployment was requested; it does not establish that the application became healthy.

For this repository, images are published as:

```text
ghcr.io/shafo3i/wordpress-nextjs:latest
ghcr.io/shafo3i/wordpress-nextjs:sha-<full-commit-sha>
```

The image name is derived from the repository owner/name and lowercased. If the repository is renamed, update `APP_IMAGE` in Coolify accordingly. The existing package lockfile, Node 24 and pnpm 10.28.0 are retained. Only the public URL is passed as an application build argument. Database, SMTP, encryption and authentication secrets remain in Coolify at runtime.

### GitHub configuration

In repository **Settings > Secrets and variables > Actions**, add:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `NEXT_PUBLIC_APP_URL` | The public application origin, identical to the URL used at runtime in Coolify. This is public configuration, not a credential. |
| Secret | `COOLIFY_WEBHOOK` | The authenticated deploy webhook for the existing Compose application, using HTTPS. |
| Secret | `COOLIFY_TOKEN` | A Coolify API token with Deploy permission and an appropriate expiration. |

`GITHUB_TOKEN` is supplied by Actions; do not create a personal access token for publishing. Image publishing gets `packages: write` only in the main-branch image job. Pull-request jobs never publish or deploy. Checkout credentials are not persisted. The workflow serializes releases so parallel runs cannot replace `latest` during the release steps. Secrets are passed through environment variables rather than interpolated into shell code; the webhook request does not follow redirects or retry POSTs automatically.

### Switch the existing Coolify Compose resource

1. Enable Coolify API access if necessary, create the Deploy token, and copy this application's deploy webhook. Do not paste the token into Git or this documentation.
2. Authenticate Docker to GHCR on the deployment server if the package is private, as the server user Coolify uses. Use a separate read-packages credential for pulling. Alternatively, deliberately configure the image package as public.
3. Keep the **same Coolify Compose resource** and change its Compose file location to `/compose.ghcr.yaml`. The original `/compose.yaml` is still available for source builds. Disable the resource's independent Git auto-deploy so it cannot bypass Actions checks or race the registry push.
4. Keep the current domain, predefined-network connection, runtime environment and uploads storage. `compose.ghcr.yaml` changes the app from `build:` to `image:` and keeps PgBouncer, the `app`/`pgbouncer` service names and the `uploads:/app/public/uploads` mount. It does not create another database.
5. Leave `APP_IMAGE` unset to use `ghcr.io/shafo3i/wordpress-nextjs:latest`, or explicitly set it to that value. GitHub must publish the first image before the resource can deploy it.
6. Push the workflow/configuration changes to `main`, watch all three jobs, then check Coolify logs and both container health states. Confirm existing media and new uploads persist.

Changing to a newly created Coolify resource can change the Compose project name and therefore create a different empty uploads volume. Reuse the existing resource; do not delete the old uploads volume. If a new resource is unavoidable, explicitly attach the existing volume before switching traffic.

Automatic deployment uses `latest`; the commit-specific tags provide traceability and rollback images. To pin or roll back, set Coolify's `APP_IMAGE` to `ghcr.io/shafo3i/wordpress-nextjs:sha-<full-commit-sha>` and redeploy. A pinned value stays pinned across later webhook calls until you change it. The workflow does not silently rewrite Coolify environment variables or claim digest-pinned automatic releases.

Local validation does not publish an image or call Coolify. The final Docker build/push and live pull/health check must be confirmed in GitHub Actions/Coolify; a local Docker Engine must be running to reproduce the build locally.

## References

- [Coolify Compose configuration and networking](https://coolify.io/docs/applications/builds/docker-compose)
- [Coolify PostgreSQL internal connections](https://coolify.io/docs/databases/postgresql)
- [PgBouncer image configuration](https://github.com/edoburu/docker-pgbouncer/tree/v1.25.1-p0)
- [PgBouncer pooling settings](https://www.pgbouncer.org/config)
