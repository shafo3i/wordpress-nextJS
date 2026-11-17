# Optional S3-compatible media uploads

Date: 16 November 2026.
Status: implemented as optional server-mediated uploads. No files are migrated automatically.

## Agreed behaviour

- Preserve local uploads and persistent storage as they work today.
- Add an upload destination choice: Local storage or S3-compatible storage.
- Local remains the default. S3 is available only after an administrator configures it.
- Support Wasabi through its S3-compatible endpoint; keep provider-specific configuration separate from media content.
- Show both destinations in the existing Media Library. Existing pagination, search, metadata editing and media selection continue to work.
- Both destinations must work with posts, pages, featured images, featured videos, Studio and site branding.
- Existing attachments remain at their current locations. No automatic migration, URL rewriting or deletion of existing uploads.

## Configuration and permissions

Administrator configuration needs the endpoint, region, bucket, optional key prefix and delivery base URL, plus private credentials supplied through the existing secret-handling mechanism or runtime environment. Never expose storage credentials through NEXT_PUBLIC variables, browser responses or logs.

Keep existing media permissions: administrators and editors can perform the media operations already permitted to them. Only administrators can configure storage credentials and destinations. Enforce this on the server, including upload authorization and completion.

Agree on the exact settings location and attachment metadata contract before implementation. Reuse the current attachment/postmeta architecture where suitable; do not introduce a new table or deployment system without approval.

## Attachment identity

Each new attachment records its destination and stable file identity. S3 attachments need the bucket, object key and any derivative keys; display URLs should be resolved from that identity and configured delivery settings. Local attachments keep their current paths.

Do not infer a backend from an arbitrary URL or require local filesystem paths for S3 files. Changing the upload default must not change existing attachment locations. Thumbnails, posters and image variants must remain associated with their parent attachment.

## Upload workflow

1. Choose files in the existing Media uploader and select a destination.
2. Authorize the operation and apply existing file count, byte, MIME/content validation and rate limits.
3. Store the file using the selected backend, generate supported derivatives and verify successful storage.
4. Register the attachment and its metadata only after successful validation/storage. Clean up only objects created by a failed upload attempt.
5. Return the attachment through the same Media Library selection flow.

Large videos may later use short-lived signed direct uploads to avoid buffering the entire video in Next.js. This requires a bounded completion/validation step before a file becomes a published attachment. A signed URL is not proof that file contents are safe. Decide this flow explicitly; do not silently introduce it while adding the destination setting.

## Security and reliability requirements

- Keep upload/write access private and use credentials restricted to the intended bucket/prefix.
- Use generated object keys so an upload cannot overwrite an unrelated attachment.
- Never accept a client-selected bucket, arbitrary endpoint or deletion key as authoritative.
- Validate file contents as well as filename/MIME declarations. Preserve image normalization and safe document/video handling.
- Preserve current XSS protections and safe content types/content disposition for uploaded files.
- If direct uploads are selected, constrain expiry, keys and allowed size/type through provider-supported controls and verify the final object server-side. Restrict bucket CORS to approved application origins.
- Previewing an attachment must not download the whole media library or run storage scans.
- Generate posters/thumbnails with bounded processing and temporary storage; remote originals must not require unrestricted server-side URL fetching.
- Deletion uses the attachment's recorded backend and owned keys. Never delete another attachment's objects or local files.
- Handle storage outages and partial derivative/deletion failures with safe errors and retryable state. Do not report a completed upload if storage failed.
- Choose public delivery/CDN or signed reads deliberately, especially for videos and byte-range playback. Do not make the entire bucket publicly writable or expose private assets.

## Verification before release

- Local upload behaviour remains unchanged, including persistence across deployment.
- S3 upload, library browsing, featured media, Studio, image variants and video playback work in English and Arabic.
- Unauthorized uploads/configuration/deletions fail before side effects.
- Oversized, deceptive and executable files are rejected or served safely under the existing policy.
- Upload completion cannot register a missing, oversized or attacker-owned object.
- Failed uploads and partial failures do not create orphaned attachments or delete unrelated files.
- Local and S3 attachments coexist; changing the default does not break old URLs.

## Configure Wasabi

Open Settings → Media storage. Supply the HTTPS service endpoint, matching region, bucket, optional prefix and public delivery base URL. For example, an endpoint of `https://s3.eu-central-1.wasabisys.com` with bucket `news-media` can use delivery base `https://s3.eu-central-1.wasabisys.com/news-media`. A CDN/custom delivery hostname may be used instead. The prefix is appended automatically; do not include it twice.

Use dedicated credentials restricted to this bucket/prefix. Writes and deletions require authenticated `s3:PutObject`/`s3:DeleteObject` permissions. The saved connection check uses `HeadBucket`, which requires bucket access (`s3:ListBucket`). That check verifies connectivity/access, not upload or anonymous delivery permissions. Configure anonymous `GetObject` only for published object paths, or provide public CDN delivery. Never grant anonymous writes or bucket listing. Wasabi may restrict public-access configuration depending on the account; configure this through Wasabi rather than the CMS. See [Wasabi public access](https://docs.wasabi.com/docs/defining-public-access-for-folders-and-files) and [AWS SDK S3 operations](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html).

Save before selecting **Test saved connection**. Then test one real image and video upload and their public URLs on your deployment. No live Wasabi credentials or bucket were used during implementation testing.

Credentials are encrypted using the existing encryption helper. Set and retain a stable private `ENCRYPTION_KEY`; rotating it requires re-entering credentials. Credential inputs remain blank after saving; blank means preserve the stored credential. Disabling S3 does not remove credentials or existing media. Local remains the initial destination in the Media Library and media picker.

## Storage and failure handling

No new database table or migration is required. Configuration is stored in the non-autoloaded `cms_media_storage` option. Each remote attachment records its HTTPS original URL in `_wp_attached_file` and destination/object identity in `_wp_attachment_metadata.storage`; originals, image derivatives and video posters are tracked together. Generated names live under `<prefix>/pressforge/<unique-id>/<year>/<month>/`.

The current upload path keeps the existing aggregate 32 MiB limit and validates files server-side. Images are normalized and resized before storage. Video posters use private temporary files, two concurrent processes maximum and bounded ffmpeg execution; `ffmpeg` must be installed (the project Docker image already supplies it). Public video playback uses Wasabi/CDN byte-range delivery. No browser-to-S3 direct uploads, signed read links or private-media delivery are introduced.

On failed uploads, cleanup is attempted only for objects generated by that attempt. A provider outage can prevent cleanup; inspect the provider for orphan objects if an upload reports failure during an outage. On committed media deletion, a cleanup intent is stored in the same database transaction before remote objects are removed. Failed deletion intents remain in existing options (`cms_media_cleanup_<attachment-id>`). Administrators can retry at most 20 per click using **Retry pending object cleanup**. This performs no filesystem/bucket scan and has no background worker. Referenced objects are preserved when another attachment shares an original or derivative.

Keep the old bucket/CDN online when changing configuration. Original delivery URLs remain stable. Cleanup of objects from a previous bucket/endpoint requires restoring credentials/configuration that can access that destination, or manual provider-side cleanup. The local thumbnail-regeneration tool remains for local files; remote derivatives are generated during upload. Historical media migration and cross-bucket migrations remain separate tasks.

## Security headers follow-up

Existing headers are unchanged. Public media currently works with the existing HTTPS image/media policy. When finalizing CSP, allow the configured Wasabi/CDN delivery origins in `img-src` and `media-src`. Uploads travel through the authenticated CMS server, so browser S3 write CORS or a broad `connect-src` allowance is not needed for this implementation. The SDK is server-only; HTTPS endpoints, DNS/socket checks, timeouts and bounded retries protect storage connections from internal-network access.

Object storage does not fix the rendering memory leak. Any migration of historical local media is a separate, explicitly approved task with backup, URL compatibility and verification.
