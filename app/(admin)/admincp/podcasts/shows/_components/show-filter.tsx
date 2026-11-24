export function ShowFilter({
  search,
  language,
  languages,
  dict,
}: {
  search: string
  language: string
  languages: { code: string; name: string; nativeName: string }[]
  dict: Record<string, string>
}) {
  const t = (key: string) => dict[`admin.podcasts.${key}`] || ""
  return (
    <form method="get" className="my-3 flex flex-wrap justify-end gap-2">
      <select
        name="lang"
        aria-label={t("language")}
        defaultValue={language}
        className="h-[30px] border border-[#8c8f94] bg-white px-2"
      >
        <option value="all">{t("all_languages")}</option>
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeName || item.name}
          </option>
        ))}
      </select>
      <input
        name="s"
        aria-label={t("search")}
        defaultValue={search}
        maxLength={200}
        className="h-[30px] border border-[#8c8f94] bg-white px-2"
      />
      <button className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1]">
        {t("search")}
      </button>
    </form>
  )
}
