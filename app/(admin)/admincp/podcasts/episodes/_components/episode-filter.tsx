export function EpisodeFilter({
  search,
  language,
  status,
  languages,
  dict,
}: {
  search: string
  language: string
  status: string
  languages: { code: string; name: string; nativeName: string }[]
  dict: Record<string, string>
}) {
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  const inputClass =
    "h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2"
  return (
    <form method="get" className="my-3 flex flex-wrap justify-end gap-2">
      <select
        name="lang"
        aria-label={t("language")}
        defaultValue={language}
        className={inputClass}
      >
        <option value="all">{t("all_languages")}</option>
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeName || item.name}
          </option>
        ))}
      </select>
      <select
        name="status"
        aria-label={t("status")}
        defaultValue={status}
        className={inputClass}
      >
        <option value="all">{t("all")}</option>
        <option value="draft">{t("draft")}</option>
        <option value="publish">{t("published")}</option>
      </select>
      <input
        name="s"
        aria-label={t("search_episodes")}
        defaultValue={search}
        maxLength={200}
        className={inputClass}
      />
      <button className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1]">
        {t("search_episodes")}
      </button>
    </form>
  )
}
