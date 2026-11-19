"use client"
import Link from "next/link"
import { CalendarDays } from "lucide-react"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { formatDate } from "@/components/site/utils"
import { SocialLinks } from "@/components/site/social-links"
import styles from "./header.module.css"

export function MastheadPublication({
  theme,
}: {
  theme: FrontEndThemeContext
}) {
  const mods = theme.mods || {}
  const date =
    mods.showDateInHeader !== false && theme.headerDate
      ? formatDate(theme.headerDate, theme.locale, theme.timeZone || "UTC")
      : ""
  const statement =
    mods.showMastheadStatement !== false && mods.showTagline !== false
      ? theme.siteTagline
      : ""
  if (!date && !statement) return null
  return (
    <div className={styles.publication} data-masthead-publication>
      {date && (
        <div className={styles.dateline}>
          <CalendarDays size={14} aria-hidden="true" />
          <time dateTime={theme.headerDate}>{date}</time>
        </div>
      )}
      {statement && <p>{statement}</p>}
    </div>
  )
}

export function MastheadUtilities({ theme }: { theme: FrontEndThemeContext }) {
  const mods = theme.mods || {}
  return (
    <div className={styles.mastheadUtilities} data-masthead-utilities>
      {mods.showMastheadLanguages !== false &&
        (theme.languages?.length || 0) > 1 && (
          <div className={styles.languages}>
            {theme.languages!.map((language) => (
              <Link
                key={language.code}
                href={language.url}
                lang={language.code}
                hrefLang={language.code}
                aria-current={language.isActive ? "page" : undefined}
                title={language.name}
              >
                {language.nativeName || language.name}
              </Link>
            ))}
          </div>
        )}
      {mods.showSocialIconsInHeader !== false && (
        <SocialLinks mods={mods} className={styles.mastheadSocials} />
      )}
    </div>
  )
}
