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

The upload runtime can be checked separately with `node --test deploy/uploads.test.mjs`. Its test files are excluded from the Docker build context.

## Deployment checks

Check both container health statuses, `/`, `/ar`, admin sign-in, Pages/Posts/Media/Settings, a migrated article image, and a new upload. Redeploy once and confirm that the uploaded file persists. Set Site Address in admin settings to the deployed public URL; imported local settings may still contain `http://localhost:3000`.

## References

- [Coolify Compose configuration and networking](https://coolify.io/docs/applications/builds/docker-compose)
- [Coolify PostgreSQL internal connections](https://coolify.io/docs/databases/postgresql)
- [PgBouncer image configuration](https://github.com/edoburu/docker-pgbouncer/tree/v1.25.1-p0)
- [PgBouncer pooling settings](https://www.pgbouncer.org/config)
