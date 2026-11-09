import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: [
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
