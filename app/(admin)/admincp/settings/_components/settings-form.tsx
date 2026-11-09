"use client"

import { SettingsEmailTemplates } from "./settings-email-templates"
import {
  SettingsSiteIdentity,
  type SettingsIdentityLanguage,
} from "./settings-site-identity"
import { useState, useTransition } from "react"
import { saveSettingsAction, sendTestEmailAction } from "../action"
import type { SettingsMap } from "@/services/settings.service"
import { MediaSelectModal } from "@/components/admin/media-select-modal"
import { SettingsLogo, useSettingsLogo } from "./settings-logo"
import {
  Globe,
  Search,
  Share2,
  BarChart2,
  Mail,
  Send,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2,
} from "lucide-react"

export function SettingsForm({
  initialSettings,
  languages = [],
  effectiveSiteUrl = "",
  timeZones = [],
  initialLogoUrl = "",
  pages = [],
  dict = {},
  direction = "ltr",
}: {
  initialSettings: SettingsMap
  languages?: SettingsIdentityLanguage[]
  effectiveSiteUrl?: string
  timeZones?: string[]
  initialLogoUrl?: string
  pages?: { id: string; title: string }[]
  dict?: Record<string, string>
  direction?: "rtl" | "ltr"
}) {
  const [activeTab, setActiveTab] = useState<
    "general" | "seo" | "social" | "analytics" | "email"
  >("general")
  const [settings, setSettings] = useState<SettingsMap>(initialSettings)
  const [notice, setNotice] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()
  const logo = useSettingsLogo(initialLogoUrl, () => setNotice(null))

  // SMTP Test Email state
  const [emailLocale, setEmailLocale] = useState(
    languages.find((language) => language.isDefault)?.code ||
      languages[0]?.code ||
      "en"
  )
  const [testEmail, setTestEmail] = useState("")
  const [testEmailStatus, setTestEmailStatus] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [isSendingTest, startTestTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [isOgMediaModalOpen, setIsOgMediaModalOpen] = useState(false)

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleCheckboxToggle = (
    key: string,
    checkedValue = "1",
    uncheckedValue = "0"
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === checkedValue ? uncheckedValue : checkedValue,
    }))
  }

  const handleSendTestEmail = () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestEmailStatus({
        type: "error",
        message: dict["admin.settings.test_email_error"],
      })
      return
    }
    setTestEmailStatus(null)
    startTestTransition(async () => {
      const res = await sendTestEmailAction(testEmail, emailLocale)
      if (res.success) {
        setTestEmailStatus({
          type: "success",
          message: dict["admin.settings.test_email_success"],
        })
      } else {
        setTestEmailStatus({
          type: "error",
          message:
            dict[res.error || ""] || dict["admin.settings.test_email_error"],
        })
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (logo.mutation.isPending) return
    setNotice(null)

    startTransition(async () => {
      try {
        await logo.savePending()
        const changes = Object.fromEntries(
          Object.entries(settings).filter(
            ([key, value]) => initialSettings[key] !== value
          )
        )
        const res = await saveSettingsAction(changes)
        if (res.success) {
          setNotice({
            type: "success",
            message: dict["admin.settings.saved_notice"],
          })
        } else {
          setNotice({
            type: "error",
            message: dict[res.error || ""] || dict["admin.settings.save_error"],
          })
        }
      } catch (error) {
        setNotice({
          type: "error",
          message:
            dict[error instanceof Error ? error.message : ""] ||
            dict["admin.settings.logo.upload_error"],
        })
      }
    })
  }

  const tabs = [
    {
      id: "general" as const,
      label: dict["admin.settings.tab_general"],
      icon: Globe,
    },
    {
      id: "seo" as const,
      label: dict["admin.settings.tab_seo"],
      icon: Search,
    },
    {
      id: "social" as const,
      label: dict["admin.settings.tab_social"],
      icon: Share2,
    },
    {
      id: "analytics" as const,
      label: dict["admin.settings.tab_analytics"],
      icon: BarChart2,
    },
    {
      id: "email" as const,
      label: dict["admin.settings.tab_email"],
      icon: Mail,
    },
  ]

  return (
    <div className="space-y-4 text-start" dir={direction}>
      {notice && (
        <div
          className={`flex items-center justify-between rounded-[3px] border-s-4 p-3 text-[13px] ${
            notice.type === "success"
              ? "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
              : "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="size-4 text-[#00a32a]" />
            ) : (
              <AlertCircle className="size-4 text-[#d63638]" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-[#c3c4c7] text-[13px]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium transition-colors ${
                isActive
                  ? "-mb-[1px] border-x border-t border-[#c3c4c7] bg-white text-[#1d2327]"
                  : "text-[#2271b1] hover:bg-[#f6f7f7] hover:text-[#135e96]"
              }`}
            >
              <Icon className="size-4 text-[#50575e]" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[3px] border border-[#c3c4c7] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
      >
        {/* ========================================================================= */}
        {/* TAB 1: GENERAL */}
        {/* ========================================================================= */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <SettingsLogo controller={logo} dict={dict} busy={isPending} />
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.general_heading"]}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.general_desc"]}
              </p>
            </div>

            <div className="space-y-4">
              <SettingsSiteIdentity
                settings={settings}
                languages={languages}
                dict={dict}
                onChange={handleChange}
              />

              {/* Admin Email */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="admin_email"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.admin_email"]}
                </label>
                <div>
                  <input
                    id="admin_email"
                    type="email"
                    value={settings.admin_email ?? ""}
                    onChange={(e) =>
                      handleChange("admin_email", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.admin_email_desc"]}
                  </p>
                </div>
              </div>

              {/* Site URL */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="siteurl"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.site_url"]}
                </label>
                <div>
                  <input
                    id="siteurl"
                    type="url"
                    value={settings.siteurl ?? ""}
                    onChange={(e) => handleChange("siteurl", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.effective_url"]}{" "}
                    <span dir="ltr">{effectiveSiteUrl}</span>
                  </p>
                </div>
              </div>

              {/* Membership / Registration */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.membership"]}
                </span>
                <div>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={
                        settings.users_can_register !== "0" &&
                        !["true", "1"].includes(settings.disableSignUp)
                      }
                      onChange={(e) => {
                        const canRegister = e.target.checked
                        setSettings((prev) => ({
                          ...prev,
                          users_can_register: canRegister ? "1" : "0",
                          disableSignUp: canRegister ? "false" : "true",
                        }))
                      }}
                      className="mt-0.5 size-4 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span className="text-[13px] text-[#2c3338]">
                      {dict["admin.settings.users_can_register"]}
                    </span>
                  </label>
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.users_can_register_desc"]}
                  </p>
                </div>
              </div>

              {/* Timezone */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="timezone_string"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.timezone"]}
                </label>
                <div>
                  <select
                    id="timezone_string"
                    value={settings.timezone_string ?? "UTC"}
                    onChange={(e) =>
                      handleChange("timezone_string", e.target.value)
                    }
                    className="h-[32px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  >
                    {timeZones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Homepage Displays (WordPress Reading Settings) */}
              <div className="grid grid-cols-1 gap-2 border-t border-[#dcdcde] pt-4 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.your_homepage_displays"]}
                </span>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="show_on_front"
                        value="posts"
                        checked={
                          (settings.show_on_front || "posts") === "posts"
                        }
                        onChange={() => handleChange("show_on_front", "posts")}
                        className="size-4 border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                      />
                      <span className="text-[13px] text-[#2c3338]">
                        {dict["admin.settings.show_on_front_posts"]}
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="show_on_front"
                        value="page"
                        checked={settings.show_on_front === "page"}
                        onChange={() => handleChange("show_on_front", "page")}
                        className="size-4 border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                      />
                      <span className="text-[13px] text-[#2c3338]">
                        {dict["admin.settings.show_on_front_page"]}
                      </span>
                    </label>
                  </div>

                  {settings.show_on_front === "page" && (
                    <div className="ms-6 flex flex-wrap items-center gap-3 rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] p-3">
                      <label
                        htmlFor="page_on_front"
                        className="text-[12px] font-semibold text-[#1d2327]"
                      >
                        {dict["admin.settings.homepage_page"]}
                      </label>
                      <select
                        id="page_on_front"
                        value={settings.page_on_front ?? ""}
                        onChange={(e) =>
                          handleChange("page_on_front", e.target.value)
                        }
                        className="h-[30px] min-w-[220px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] focus:border-[#2271b1] focus:outline-none"
                      >
                        <option value="">
                          {dict["admin.settings.select_page"]}
                        </option>
                        {pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      {settings.page_on_front && (
                        <a
                          href={`/admincp/studio/${settings.page_on_front}`}
                          className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#2563eb] px-3 py-1 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
                        >
                          <span>S</span>
                          <span>{dict["admin.studio.edit_with_studio"]}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEO & INDEXING */}
        {/* ========================================================================= */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.seo_heading"]}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.seo_desc"]}
              </p>
            </div>

            <div className="space-y-5">
              {/* Search Engine Visibility (blog_public) */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.visibility"]}
                </span>
                <div>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={settings.blog_public === "0"}
                      onChange={() =>
                        handleCheckboxToggle("blog_public", "0", "1")
                      }
                      className="mt-0.5 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#1d2327]">
                        {dict["admin.settings.discourage_search_engines"]}
                      </span>
                      <p className="text-[11px] text-[#646970]">
                        {dict["admin.settings.discourage_help"]}
                      </p>
                    </div>
                  </label>
                  {settings.blog_public === "0" && (
                    <div className="mt-2 inline-block rounded border border-[#d63638]/20 bg-[#fcf0f1] px-2.5 py-1 text-[11px] font-semibold text-[#d63638]">
                      ⚠️ {dict["admin.settings.indexing_blocked_warning"]}
                    </div>
                  )}
                </div>
              </div>

              {/* Title Template */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="seo_meta_title_template"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.title_template"]}
                </label>
                <div>
                  <input
                    id="seo_meta_title_template"
                    type="text"
                    value={
                      settings.seo_meta_title_template ?? "%title% — %sitename%"
                    }
                    onChange={(e) =>
                      handleChange("seo_meta_title_template", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.title_template_desc"]}
                  </p>
                </div>
              </div>

              {/* Default Meta Description */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="seo_default_meta_description"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.default_meta_desc"]}
                </label>
                <div>
                  <textarea
                    id="seo_default_meta_description"
                    rows={3}
                    value={settings.seo_default_meta_description ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "seo_default_meta_description",
                        e.target.value
                      )
                    }
                    className="w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white p-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.default_meta_desc_help"]}
                  </p>
                </div>
              </div>

              {/* Canonical URLs */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.canonical"]}
                </span>
                <div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.seo_canonical_enabled === "1"}
                      onChange={() =>
                        handleCheckboxToggle("seo_canonical_enabled", "1", "0")
                      }
                      className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span className="text-[13px] text-[#1d2327]">
                      {dict["admin.settings.canonical_enable"]}
                    </span>
                  </label>
                </div>
              </div>

              {/* Robots Directives */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="seo_robots_extra"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.robots_directives"]}
                </label>
                <div>
                  <input
                    id="seo_robots_extra"
                    type="text"
                    value={
                      settings.seo_robots_extra ?? "max-image-preview:large"
                    }
                    onChange={(e) =>
                      handleChange("seo_robots_extra", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.robots_directives_desc"]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SOCIAL & OPEN GRAPH */}
        {/* ========================================================================= */}
        {activeTab === "social" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.social_heading"]}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.social_desc"]}
              </p>
            </div>

            <div className="space-y-4">
              {/* Default OG Image */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.og_image"]}
                </label>
                <div className="space-y-3">
                  {settings.og_default_image ? (
                    <div className="max-w-md space-y-2">
                      <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-[3px] border border-[#dcdcde] bg-[#f0f0f1] shadow-xs">
                        <img
                          src={settings.og_default_image}
                          alt="Open Graph preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsOgMediaModalOpen(true)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-white px-3 py-1 text-[12px] font-medium text-[#2271b1] transition-colors hover:bg-[#f0f6fc]"
                        >
                          <ImageIcon className="size-3.5" />
                          <span>{dict["admin.settings.replace_image"]}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("og_default_image", "")}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] border border-[#d63638] bg-white px-3 py-1 text-[12px] font-medium text-[#d63638] transition-colors hover:bg-[#fcf0f1]"
                        >
                          <Trash2 className="size-3.5" />
                          <span>{dict["admin.settings.remove_image"]}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsOgMediaModalOpen(true)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#f0f6fc] px-4 py-2 text-[13px] font-medium text-[#2271b1] transition-colors hover:bg-[#2271b1] hover:text-white"
                      >
                        <ImageIcon className="size-4" />
                        <span>{dict["admin.settings.select_og_image"]}</span>
                      </button>
                    </div>
                  )}

                  {/* Manual URL field */}
                  <div>
                    <input
                      id="og_default_image"
                      type="text"
                      value={settings.og_default_image ?? ""}
                      onChange={(e) =>
                        handleChange("og_default_image", e.target.value)
                      }
                      className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[12px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.og_image_desc"]}
                    </p>
                  </div>
                </div>
              </div>

              {/* OG Site Name */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="og_site_name"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.og_site_name"]}
                </label>
                <div>
                  <input
                    id="og_site_name"
                    type="text"
                    value={settings.og_site_name ?? ""}
                    onChange={(e) =>
                      handleChange("og_site_name", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Twitter Card Type */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="twitter_card_type"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.twitter_card"]}
                </label>
                <div>
                  <select
                    id="twitter_card_type"
                    value={settings.twitter_card_type ?? "summary_large_image"}
                    onChange={(e) =>
                      handleChange("twitter_card_type", e.target.value)
                    }
                    className="h-[32px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  >
                    <option value="summary_large_image">
                      Summary with Large Image (Standard for news)
                    </option>
                    <option value="summary">Summary (Small thumbnail)</option>
                  </select>
                </div>
              </div>

              {/* Twitter Site Handle */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="twitter_site_handle"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.twitter_handle"]}
                </label>
                <div>
                  <input
                    id="twitter_site_handle"
                    type="text"
                    value={settings.twitter_site_handle ?? ""}
                    onChange={(e) =>
                      handleChange("twitter_site_handle", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Facebook App ID */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="facebook_app_id"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.fb_app_id"]}
                </label>
                <div>
                  <input
                    id="facebook_app_id"
                    type="text"
                    value={settings.facebook_app_id ?? ""}
                    onChange={(e) =>
                      handleChange("facebook_app_id", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ANALYTICS & SCRIPTS */}
        {/* ========================================================================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.analytics_heading"]}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.analytics_desc"]}
              </p>
            </div>

            <div className="space-y-4">
              {/* Google Search Console */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="google_site_verification"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.gsc"]}
                </label>
                <div>
                  <input
                    id="google_site_verification"
                    type="text"
                    value={settings.google_site_verification ?? ""}
                    onChange={(e) =>
                      handleChange("google_site_verification", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.gsc_desc"]}
                  </p>
                </div>
              </div>

              {/* Bing Webmaster */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="bing_site_verification"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.bing"]}
                </label>
                <div>
                  <input
                    id="bing_site_verification"
                    type="text"
                    value={settings.bing_site_verification ?? ""}
                    onChange={(e) =>
                      handleChange("bing_site_verification", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                </div>
              </div>

              {/* Google Analytics 4 */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="google_analytics_id"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.ga4"]}
                </label>
                <div>
                  <input
                    id="google_analytics_id"
                    type="text"
                    value={settings.google_analytics_id ?? ""}
                    onChange={(e) =>
                      handleChange("google_analytics_id", e.target.value)
                    }
                    className="h-[32px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.ga4_desc"]}
                  </p>
                </div>
              </div>

              {/* Custom Header Scripts */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="custom_header_scripts"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.header_scripts"]}
                </label>
                <div>
                  <textarea
                    id="custom_header_scripts"
                    disabled
                    rows={4}
                    value={settings.custom_header_scripts ?? ""}
                    onChange={(e) =>
                      handleChange("custom_header_scripts", e.target.value)
                    }
                    className="w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white p-2.5 font-mono text-[12px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.scripts_unavailable"]}
                  </p>
                </div>
              </div>

              {/* Custom Footer Scripts */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="custom_footer_scripts"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.footer_scripts"]}
                </label>
                <div>
                  <textarea
                    id="custom_footer_scripts"
                    disabled
                    rows={4}
                    value={settings.custom_footer_scripts ?? ""}
                    onChange={(e) =>
                      handleChange("custom_footer_scripts", e.target.value)
                    }
                    className="w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white p-2.5 font-mono text-[12px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.scripts_unavailable"]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: EMAIL & NOTIFICATIONS                                             */}
        {/* ========================================================================= */}
        {activeTab === "email" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-[16px] font-semibold text-[#1d2327]">
                {dict["admin.settings.email_heading"]}
              </h2>
              <p className="text-[12px] text-[#646970]">
                {dict["admin.settings.email_desc"]}
              </p>
            </div>

            {/* Sub-Section 1: SMTP Server Configuration */}
            <div className="space-y-6 border-t border-[#dcdcde] pt-6">
              <h3 className="text-[14px] font-semibold text-[#1d2327]">
                {dict["admin.settings.smtp_section"]}
              </h3>

              {/* SMTP Host */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="smtp_host"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.smtp_host"]}
                </label>
                <div>
                  <input
                    id="smtp_host"
                    type="text"
                    value={settings.smtp_host ?? ""}
                    onChange={(e) => handleChange("smtp_host", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_host_desc"]}
                  </p>
                </div>
              </div>

              {/* SMTP Port & Secure */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="smtp_port"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.smtp_port"]}
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <input
                      id="smtp_port"
                      type="text"
                      value={settings.smtp_port ?? "587"}
                      onChange={(e) =>
                        handleChange("smtp_port", e.target.value)
                      }
                      className="h-[32px] w-28 rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.smtp_port_desc"]}
                    </p>
                  </div>

                  <div>
                    <select
                      id="smtp_secure"
                      value={settings.smtp_secure ?? "tls"}
                      onChange={(e) =>
                        handleChange("smtp_secure", e.target.value)
                      }
                      className="h-[32px] rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    >
                      <option value="tls">
                        {dict["admin.settings.smtp_secure_tls"]}
                      </option>
                      <option value="ssl">
                        {dict["admin.settings.smtp_secure_ssl"]}
                      </option>
                      <option value="none">
                        {dict["admin.settings.smtp_secure_none"]}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SMTP User */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="smtp_user"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.smtp_user"]}
                </label>
                <div>
                  <input
                    id="smtp_user"
                    type="text"
                    value={settings.smtp_user ?? ""}
                    onChange={(e) => handleChange("smtp_user", e.target.value)}
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_user_desc"]}
                  </p>
                </div>
              </div>

              {/* SMTP Password (Encrypted) */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="smtp_pass"
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327]"
                >
                  <Lock className="size-3.5 text-[#00a32a]" />
                  <span>{dict["admin.settings.smtp_pass"]}</span>
                </label>
                <div>
                  <div className="relative max-w-md">
                    <input
                      id="smtp_pass"
                      type={showPassword ? "text" : "password"}
                      value={settings.smtp_pass ?? ""}
                      onChange={(e) =>
                        handleChange("smtp_pass", e.target.value)
                      }
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 pe-9 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                      placeholder={dict["admin.settings.smtp_pass_placeholder"]}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 flex items-center px-2.5 text-[#646970] hover:text-[#1d2327]"
                    >
                      {showPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#646970]">
                    <span className="font-medium text-[#00a32a]">
                      ✓ AES-256-GCM
                    </span>
                    <span>{dict["admin.settings.smtp_pass_desc"]}</span>
                  </p>
                </div>
              </div>

              {/* SMTP From Email */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="smtp_from_email"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.smtp_from_email"]}
                </label>
                <div>
                  <input
                    id="smtp_from_email"
                    type="email"
                    value={settings.smtp_from_email ?? ""}
                    onChange={(e) =>
                      handleChange("smtp_from_email", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_from_email_desc"]}
                  </p>
                </div>
              </div>

              {/* SMTP From Name */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="smtp_from_name"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.smtp_from_name"]}
                </label>
                <div>
                  <input
                    id="smtp_from_name"
                    type="text"
                    value={settings.smtp_from_name ?? ""}
                    onChange={(e) =>
                      handleChange("smtp_from_name", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {dict["admin.settings.smtp_from_name_desc"]}
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Section 2: Notifications Configuration */}
            <div className="space-y-6 border-t border-[#dcdcde] pt-6">
              <h3 className="text-[14px] font-semibold text-[#1d2327]">
                {dict["admin.settings.notifications_section"]}
              </h3>

              {/* Admin Notification Email */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <label
                  htmlFor="admin_notification_email"
                  className="text-[13px] font-semibold text-[#1d2327]"
                >
                  {dict["admin.settings.admin_notification_email"]}
                </label>
                <div>
                  <input
                    id="admin_notification_email"
                    disabled
                    type="email"
                    value={settings.admin_notification_email ?? ""}
                    onChange={(e) =>
                      handleChange("admin_notification_email", e.target.value)
                    }
                    className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#646970]">
                    {
                      dict[
                        "admin.settings.publication_notifications_unavailable"
                      ]
                    }
                  </p>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
                <span className="text-[13px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.notifications_section"]}
                </span>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#2c3338]">
                    <input
                      type="checkbox"
                      disabled
                      checked={false}
                      onChange={() =>
                        handleCheckboxToggle("enable_new_post_notifications")
                      }
                      className="size-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>
                      {dict["admin.settings.enable_new_post_notifications"]}
                    </span>
                    <span className="text-[11px] text-[#646970]">
                      {
                        dict[
                          "admin.settings.publication_notifications_unavailable"
                        ]
                      }
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#2c3338]">
                    <input
                      type="checkbox"
                      checked={settings.enable_newsletter_notifications === "1"}
                      onChange={() =>
                        handleCheckboxToggle("enable_newsletter_notifications")
                      }
                      className="size-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    <span>
                      {dict["admin.settings.enable_newsletter_notifications"]}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sub-Section 3: Email Templates Wording (Configurable in UI) */}
            <div className="space-y-6 border-t border-[#dcdcde] pt-6">
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.templates_section"]}
                </h3>
                <p className="text-[12px] text-[#646970]">
                  {dict["admin.settings.templates_section_desc"]}
                </p>
              </div>

              {/* Template 1: New Post Notification */}
              <div className="space-y-4 rounded-[4px] border border-[#dcdcde] bg-[#f9fafb] p-4">
                <h4 className="text-[13px] font-bold text-[#1d2327]">
                  {dict["admin.settings.tpl_new_post_heading"]}
                </h4>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label
                    htmlFor="email_new_post_subject"
                    className="text-[12px] font-medium text-[#1d2327]"
                  >
                    {dict["admin.settings.tpl_new_post_subject"]}
                  </label>
                  <div>
                    <input
                      id="email_new_post_subject"
                      disabled
                      type="text"
                      value={settings.email_new_post_subject ?? ""}
                      onChange={(e) =>
                        handleChange("email_new_post_subject", e.target.value)
                      }
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#646970]">
                      {dict["admin.settings.tpl_new_post_subject_desc"]}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                  <label
                    htmlFor="email_new_post_heading"
                    className="text-[12px] font-medium text-[#1d2327]"
                  >
                    {dict["admin.settings.tpl_new_post_title"]}
                  </label>
                  <div>
                    <input
                      id="email_new_post_heading"
                      disabled
                      type="text"
                      value={settings.email_new_post_heading ?? ""}
                      onChange={(e) =>
                        handleChange("email_new_post_heading", e.target.value)
                      }
                      className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <SettingsEmailTemplates
                settings={settings}
                languages={languages}
                dict={dict}
                locale={emailLocale}
                onLocaleChange={setEmailLocale}
                onChange={handleChange}
              />
            </div>

            {/* Sub-Section 4: Live SMTP Connection Test */}
            <div className="space-y-4 border-t border-[#dcdcde] pt-6">
              <div>
                <h3 className="text-[14px] font-semibold text-[#1d2327]">
                  {dict["admin.settings.test_email_section"]}
                </h3>
                <p className="text-[12px] text-[#646970]">
                  {dict["admin.settings.test_email_desc"]}
                </p>
              </div>

              {testEmailStatus && (
                <div
                  className={`flex items-center justify-between rounded-[3px] border-s-4 p-3 text-[13px] ${
                    testEmailStatus.type === "success"
                      ? "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
                      : "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testEmailStatus.type === "success" ? (
                      <CheckCircle2 className="size-4 text-[#00a32a]" />
                    ) : (
                      <AlertCircle className="size-4 text-[#d63638]" />
                    )}
                    <span>{testEmailStatus.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTestEmailStatus(null)}
                    className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex max-w-xl flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder={dict["admin.settings.test_email_address"]}
                  className="h-[32px] flex-1 rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={handleSendTestEmail}
                  className="inline-flex h-[32px] items-center justify-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 text-[13px] font-medium text-white shadow-sm hover:border-[#135e96] hover:bg-[#135e96] focus:outline-none disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{dict["admin.settings.test_email_sending"]}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>{dict["admin.settings.test_email_send"]}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Changes Button Footer */}
        <div className="mt-8 border-t border-[#dcdcde] pt-5">
          <button
            type="submit"
            disabled={isPending || logo.mutation.isPending}
            className="inline-flex items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white shadow-sm hover:border-[#135e96] hover:bg-[#135e96] focus:outline-none disabled:opacity-50"
          >
            {isPending || logo.mutation.isPending
              ? dict["admin.common.saving"]
              : dict["admin.settings.save_changes"]}
          </button>
        </div>
      </form>

      {/* Media Library Selector Modal */}
      <MediaSelectModal
        isOpen={isOgMediaModalOpen}
        onClose={() => setIsOgMediaModalOpen(false)}
        onSelect={(item) => handleChange("og_default_image", item.url)}
        title={dict["admin.settings.select_og_image"]}
        selectButtonText={dict["admin.settings.set_og_image"]}
        dict={dict}
      />
    </div>
  )
}
