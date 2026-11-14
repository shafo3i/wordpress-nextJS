import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "mobile-navigation.browser.spec.ts",
    "featured-video.browser.spec.ts",
    "appearance-security.browser.spec.ts",
    "pages-security.browser.spec.ts",
    "media-security.browser.spec.ts",
    "language-security.browser.spec.ts",
    "comments-security.browser.spec.ts",
    "themes-security.browser.spec.ts",
    "tags-key.browser.spec.ts",
    "profile-security.browser.spec.ts",
    "user-management.browser.spec.ts",
    "editorial-layouts.browser.spec.ts",
    "settings-logo-library.browser.spec.ts",
    "media-details.browser.spec.ts",
    "container-width.browser.spec.ts",
    "plugins.browser.spec.ts",
    "post-editor-recovery.browser.spec.ts",
    "settings-identity.browser.spec.ts",
    "ticker-interaction.browser.spec.ts",
    "studio-design.browser.spec.ts",
    "admin-runtime.browser.spec.ts",
    "studio-security.browser.spec.ts",
    "studio-content.browser.spec.ts",
    "settings-logo.browser.spec.ts",
  ],
  workers: 1,
  use: {
    headless: true,
    channel:
      process.env.STUDIO_BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
  },
})
