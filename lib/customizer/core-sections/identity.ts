import type { CustomizerSection } from "../types";

export const identitySection: CustomizerSection = {
  id: "identity",
  title: "Site Identity & Branding",
  titleKey: "admin.customizer.section.identity",
  icon: "Sparkles",
  priority: 10,
  groups: [
    {
      id: "title",
      settings: [
        { id: "siteTitle", type: "text", label: "Site Title", store: "site" },
        { id: "showSiteTitle", type: "toggle", label: "Display Site Title in Header", default: true },
        { id: "siteTagline", type: "text", label: "Tagline / Publication Motto", store: "site" },
        { id: "showTagline", type: "toggle", label: "Display Tagline in Header", default: true },
      ],
    },
    {
      id: "logo",
      settings: [
        {
          id: "logoUrl",
          type: "image",
          label: "Custom Logo Image URL (Optional)",
          placeholder: "https://.../logo.png",
        },
        {
          id: "logoWidth",
          type: "range",
          label: "Logo Width",
          default: 180,
          min: 80,
          max: 320,
          step: 5,
          unit: "px",
          showIf: { id: "logoUrl", notEquals: "" },
        },
        {
          id: "faviconUrl",
          type: "image",
          label: "Site Icon / Favicon URL",
          placeholder: "https://.../favicon.ico",
        },
      ],
    },
    {
      id: "social",
      title: "Social Profiles",
      settings: [
        { id: "socialFacebook", type: "text", label: "Facebook URL", placeholder: "https://facebook.com/yourpage" },
        { id: "socialX", type: "text", label: "X (Twitter) URL", placeholder: "https://x.com/yourhandle" },
        { id: "socialInstagram", type: "text", label: "Instagram URL", placeholder: "https://instagram.com/yourhandle" },
        { id: "socialYoutube", type: "text", label: "YouTube URL", placeholder: "https://youtube.com/@yourchannel" },
        { id: "socialLinkedin", type: "text", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/yourcompany" },
      ],
    },  ],
};
