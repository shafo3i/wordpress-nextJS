# Social preview font

Noto Sans Arabic includes Arabic and Latin glyphs and is used by the server's Sharp/Pango social-image renderer. It is bundled to avoid runtime font downloads and platform-dependent system font fallbacks.

Source: https://github.com/google/fonts/tree/main/ofl/notosansarabic

The unmodified variable font is stored as `NotoSansArabic.ttf`. Its SIL Open Font License is included in `OFL.txt`. Docker copies this directory with `public/`; Next output tracing explicitly includes the font for serverless packaging.
