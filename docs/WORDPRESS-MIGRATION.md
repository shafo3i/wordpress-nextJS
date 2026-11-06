# WordPress migration

The migration merges the April and October SQL snapshots with the newer WordPress XML. It imports the main `jbk_` installation only. Overlapping IDs are merged; the newest available record wins. Unrelated default WordPress tables, old pages, revisions, plugin code and email logs are excluded.

## Destination

Use the new PostgreSQL database configured in `.env`. Never commit the connection string. The importer requires an explicit host and database match, an empty destination, and a transaction lock. It does not truncate an existing database. A source fingerprint makes rerunning the completed import a no-op.

The destination schema must exist before importing. For a new, verified empty database, initialize it using `pnpm exec drizzle-kit push` and review the proposed changes.

## Content and homepages

- All 5,077 source article records are retained, including private, draft, pending and trash statuses; 5,057 are published.
- All 18 categories, 7,012 tags and three post formats are retained, including their relationships.
- All 4,680 attachment records and 207 comments are retained. Historic authors retain attribution without importing their WordPress passwords or creating login credentials for them.
- Exactly two new pages are created: an English homepage and an Arabic homepage, linked as translations and editable in Studio. The layout includes ticker, slider, news sections and compact recent/popular widgets. No synthetic articles, categories, comments or images are seeded.
- The source site declares Arabic. Imported content remains Arabic; English widgets remain empty until English articles are added. English translations are not fabricated.
- Original IDs, dates, statuses, metadata and featured-image links are preserved. PHP attachment metadata is converted into JSON. Article HTML is sanitized; original HTML is archived in post metadata when conversion changes it. WordPress media URLs and recognized article links are rewritten for this application.

## Scripts

Run from the `news` directory:

```powershell
python scripts/wordpress_migration/stage.py
python scripts/wordpress_migration/prepare.py
python scripts/wordpress_migration/media.py
python scripts/wordpress_migration/media.py --copy
pnpm exec tsx scripts/wordpress_migration/convert.ts
pnpm exec tsx scripts/wordpress_migration/import.ts
pnpm exec tsx scripts/wordpress_migration/import.ts --apply --expect-host YOUR_DB_HOST --expect-database YOUR_DB_NAME --admin-email YOUR_EMAIL
```

The media command defaults to a preview. `--copy` copies allowed media files into `public/uploads`, rejects unsafe paths, does not overwrite different existing files, and attempts to retrieve missing originals from the original site's approved host. An archived image size may be used when its original is missing. Missing files remain explicitly reported rather than silently deleting attachment records.

HTML conversion runs in bounded worker batches before the database transaction. Completed batches are cached against the source fingerprint, so retries do not repeat conversion. The importer analyzes the loaded tables and recalculates taxonomy/comment totals with grouped queries.

Private working files are in `.local/wordpress-migration/` (ignored by Git):

- `preflight.json`: source counts and conversion issues.
- `media-report.json`: copied files, recoveries and missing originals.
- `result.json`: committed import counts and homepage IDs.
- `admin-credentials.json`: generated administrator email and password. Keep this file private; change the password after first login at `/cms-login`.

## Coolify media storage

The URL and filesystem convention for both migrated media and future uploads is `/uploads/...`, backed by the application's `public/uploads` directory. There is no second `wp-content/uploads` tree required in production.

1. Configure a persistent volume or bind mount at the application's **actual runtime** `public/uploads` directory. Check the Dockerfile/runtime working directory; do not guess its absolute path.
2. Transfer the **contents** of local `public/uploads` into that volume over SFTP/SSH/rsync. The copied library is approximately 4.9 GB. SFTP is preferable to unencrypted FTP.
3. Ensure the application user can read existing media and write new uploads. Never make the directory world writable.
4. Point the Coolify application at the same new PostgreSQL database. Set its public URL and authentication URL/origin to the deployed hostname, then rebuild/restart the application.
5. Verify both `/` and `/ar`, administrator login, representative article images, media browsing and a new upload. Keep backups of the database and persistent media volume together.

Local media, SQL dumps, extracted archives, staging files and credentials are not deployment assets in Git. The volume must be populated separately. A successful application build alone does not transfer the media library.

## Verification

```powershell
python -m unittest discover -s scripts/wordpress_migration -p "test_*.py"
pnpm exec vitest run scripts/wordpress_migration
pnpm exec vitest run lib/site-content.test.ts
pnpm exec tsc --noEmit
pnpm exec tsx scripts/wordpress_migration/verify.ts
```

The importer validates article/attachment/page counts and featured-image references before committing, and resets source-ID sequences so subsequent content creation does not collide with imported IDs. Production behavior and media persistence should also be checked after deployment.

## Completed import findings

The committed import has 5,077 articles, 4,680 attachment records, two homepages, 18 categories, 7,012 tags, three post formats and 207 comments. Featured-image attachment references have no orphan IDs.

There are 77 unavailable original media files. Their records remain in the database and their IDs/paths are recorded in the private reports. Two source HTML attachments are also retained as records but deliberately excluded from public file storage to avoid serving active HTML under the application origin. Possible filename matches for a few missing images are saved separately for manual review; unrelated images were not substituted.

Local browser checks passed for both homepages, an Arabic article and featured image, administrator login, Pages, Posts, Media, Settings and the Arabic Studio editor. Arabic article/category lookups now decode percent-encoded route slugs; regression tests cover encoded Arabic posts/pages/categories and malformed encoding. The English homepage has its starter widgets but no invented English news.
