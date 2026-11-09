import { describe, expect, it } from "vitest"
import { localizedSiteOptions, parseSiteIdentity } from "@/lib/site-identity"
import { settingsPatchSchema } from "@/db/schema/cms-settings"
import { buildSiteMetadata } from "@/lib/seo/metadata"
import { formatDate } from "@/components/site/utils"

const options = {
  blogname: "Default name",
  blogdescription: "Default tagline",
  siteurl: "https://news.example",
  og_site_name: "Default name",
  site_identity_translations: JSON.stringify({
    en: { title: "English name", tagline: "English tagline" },
  }),
}
describe("localized site settings", () => {
  it("keeps Customizer defaults and localized overrides synchronized without mutating stored options", () => {
    expect(localizedSiteOptions(options, "ar", "ar")).toMatchObject({
      blogname: "Default name",
      blogdescription: "Default tagline",
    })
    expect(localizedSiteOptions(options, "en", "ar")).toMatchObject({
      blogname: "English name",
      blogdescription: "English tagline",
      og_site_name: "English name",
    })
    expect(options.blogname).toBe("Default name")
    expect(localizedSiteOptions(options, "fr", "ar").blogname).toBe(
      "Default name"
    )
  })
  it("supports an intentionally empty translated tagline and safe legacy fallback", () => {
    expect(
      localizedSiteOptions(
        { ...options, site_identity_translations: '{"en":{"tagline":""}}' },
        "en",
        "ar"
      ).blogdescription
    ).toBe("")
    expect(parseSiteIdentity("not JSON")).toEqual({})
    expect(parseSiteIdentity('{"en":{"title":123}}')).toEqual({ en: {} })
    expect(parseSiteIdentity("[]")).toEqual({})
  })
  it("renders localized metadata and webmaster verification tokens", () => {
    const metadata = buildSiteMetadata(
      localizedSiteOptions(
        {
          ...options,
          google_site_verification: "google-token",
          bing_site_verification: "bing-token",
        },
        "en",
        "ar"
      )
    )
    expect(metadata.title).toMatchObject({ default: "English name" })
    expect(metadata.verification).toEqual({
      google: "google-token",
      other: { "msvalidate.01": "bing-token" },
    })
  })
  it("uses the saved timezone for public dates", () => {
    const instant = "2026-11-09T00:30:00Z"
    expect(formatDate(instant, "en", "America/New_York")).toContain("8")
    expect(formatDate(instant, "en", "Asia/Riyadh")).toContain("9")
  })
  it.each([
    { active_plugins: '["unrequested"]' },
    { timezone_string: "invalid/zone" },
    { google_analytics_id: "G-X<script>" },
    { siteurl: "javascript:alert(1)" },
    { site_identity_translations: '{"en":{"title":123}}' },
    { site_identity_translations: '{"en":{"title":"Name","unexpected":true}}' },
    { custom_header_scripts: "<script>alert(1)</script>" },
    { enable_new_post_notifications: "1" },
  ])("rejects invalid or unsupported settings: %o", (patch) =>
    expect(settingsPatchSchema.safeParse(patch).success).toBe(false)
  )
  it("accepts supported settings", () => {
    expect(
      settingsPatchSchema.safeParse({
        blogname: "Name",
        site_identity_translations: options.site_identity_translations,
        google_analytics_id: "G-ABC123",
        timezone_string: "Europe/London",
        users_can_register: "0",
        smtp_port: "587",
      }).success
    ).toBe(true)
  })
})
