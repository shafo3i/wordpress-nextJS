# Bundled fonts

These are the existing open-source Customizer families plus Geist Mono for the base UI. Each family includes its upstream OFL licence. Effra is not included.

`SOURCES.json` records the original Google Fonts stylesheet, official Google Fonts repository licence URL, original asset URL and SHA-256 digest for every WOFF2 file. Runtime CSS refers only to local files. No font download runs during installation or Docker/Next builds.

Keep the font IDs, family names, weights, italic faces and Unicode ranges aligned with `lib/customizer/fonts.ts` when updating assets. Georgia remains a system font. The root layout loads Inter and Geist Mono stylesheets; theme and Studio components add only selected families. React stylesheet precedence deduplicates repeated links. Browsers fetch the font subsets actually needed by rendered text, using `font-display: swap`.

Do not remove licence files when distributing these assets. Font updates should be deliberate, with updated provenance hashes and font-loading tests.
