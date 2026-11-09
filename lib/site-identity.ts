export type SiteIdentityTranslations = Record<
  string,
  { title?: string; tagline?: string }
>

export function parseSiteIdentity(value?: string): SiteIdentityTranslations {
  try {
    const parsed: unknown = JSON.parse(value || "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {}
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([code, entry]) =>
            /^[a-z]{2,3}(?:-[a-z0-9]{2,8}){0,2}$/i.test(code) &&
            entry &&
            typeof entry === "object" &&
            !Array.isArray(entry)
        )
        .map(([code, entry]) => [
          code,
          {
            ...(typeof entry.title === "string" ? { title: entry.title } : {}),
            ...(typeof entry.tagline === "string"
              ? { tagline: entry.tagline }
              : {}),
          },
        ])
    )
  } catch {
    return {}
  }
}

/** Legacy identity remains the default language and the fallback for untranslated names. */
export function localizedSiteOptions(
  options: Record<string, string>,
  locale?: string,
  defaultLocale?: string
): Record<string, string> {
  const translation =
    locale && locale !== defaultLocale
      ? parseSiteIdentity(options.site_identity_translations)[locale]
      : undefined
  const blogname = translation?.title?.trim() || options.blogname || ""
  // An explicit empty translated tagline hides it; an absent value inherits the default.
  const blogdescription =
    translation?.tagline !== undefined
      ? translation.tagline.trim()
      : options.blogdescription || ""
  return {
    ...options,
    blogname,
    blogdescription,
    og_site_name:
      !options.og_site_name || options.og_site_name === options.blogname
        ? blogname
        : options.og_site_name,
    seo_default_meta_description:
      !options.seo_default_meta_description ||
      options.seo_default_meta_description === options.blogdescription
        ? blogdescription
        : options.seo_default_meta_description,
  }
}
