# Optional S3-compatible media uploads

Date: 16 November 2026.
Status: proposed for later implementation. This document does not enable S3 or migrate files.

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

## Work order

1. Fix and regression-test the reproduced article-rendering memory growth.
2. Continue the agreed site-wide security work, including headers and deployed verification.
3. Return to this optional storage feature after confirming its implementation scope.

Object storage does not fix the rendering memory leak. Any migration of historical local media is a separate, explicitly approved task with backup, URL compatibility and verification.
