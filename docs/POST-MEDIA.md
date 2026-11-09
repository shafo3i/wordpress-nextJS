# Post media

## Editor and library

Featured-image selection lists images in pages of 40 with previous/next navigation, total count and search. Add Media uses the same paginated picker and can filter images, video and audio. Its queries use TanStack Query with separate cache keys for type, search and page, a 30-second freshness window, and invalidation after uploads. Selection remains available while navigating library pages.

Add Media inserts the selected attachment at the current visual-editor position or text-editor selection. Images insert image markup; videos and audio insert native players with controls. Featured images remain image-only.

The localized Insert video button accepts YouTube, Vimeo and direct MP4, WebM, Ogg/OGV or M4V URLs. Uploads support MP4/M4V (`video/mp4`), WebM and OGV containers. The server checks video extension, MIME type and basic container signatures before writing. Each upload request is limited to 32 MB; the Server Action request limit is 34 MB to accommodate multipart overhead. Larger videos need external hosting or a future streaming-upload endpoint. The media library's displayed size limit now matches the enforced limit.

## Public posts

Standalone YouTube/Vimeo/video URLs and links are converted to players when rendering either localized post route. WordPress embed wrappers and `[embed]` shortcodes are supported. Links within ordinary sentences remain links. Existing content does not need to be resaved for this rendering behavior.

Provider URLs are parsed locally, with no server-side requests to arbitrary video URLs. Only recognized YouTube and Vimeo iframe hosts are allowed. URLs are normalized to canonical HTTPS players, including Vimeo unlisted hashes. Article HTML is sanitized; arbitrary iframes, scripts, event handlers, unsafe protocols and iframe srcdoc attributes are removed. Native players use controls and metadata preloading rather than forced autoplay. The uploads server already supports video MIME types and byte-range requests.

Related-news headings use the article's language dictionary. Related queries use that same language, links respect the site's default-language routing, and titles/categories are escaped before insertion into plugin HTML.

## TinyMCE assets and verification

The self-hosted browser assets under public/tinymce now match the installed TinyMCE 8.9.3 package. Updating the package alone does not update copied browser assets; synchronize these files when upgrading TinyMCE again.

TinyMCE keeps iframe sandboxing enabled. Its editor-preview exceptions are limited to the canonical YouTube, YouTube privacy-enhanced and Vimeo player hosts. Previously saved trusted embeds have stale sandbox attributes removed when loaded into the editor; unrelated iframe hosts remain sandboxed. Public rendering continues to apply the stricter provider allowlist.

Security regression tests cover provider URL spoofing, iframe/script injection, Vimeo hashes, standalone versus inline links, native player insertion and video container checks. The bilingual browser script exercises library pagination and insertion without saving or publishing posts. It verifies generated player markup; actual third-party playback also depends on provider permissions and the visitor's browser/codecs.

Provider references: [YouTube embed format](https://developers.google.com/youtube/player_parameters), [Vimeo unlisted embeds](https://developer.vimeo.com/player/sdk/embed).
