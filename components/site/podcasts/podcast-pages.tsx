import { cache } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Headphones, Play } from "lucide-react"
import { getFrontEndThemeContext } from "@/lib/site-theme"
import {
  getArchiveSettings,
  archivePageNumbers,
} from "@/lib/customizer/archive"
import { localizePath, t } from "@/components/site/utils"
import { SiteHeader } from "@/components/site/header/site-header"
import { SiteFooter } from "@/components/site/footer/site-footer"
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles"
import { PublicAdminBar } from "@/components/site/admin/public-admin-bar"
import { getAllWidgetAreas } from "@/lib/widgets/db"
import {
  getPublicPodcastEpisode,
  getPublicPodcastShow,
  listPublicPodcastEpisodes,
  listPublicPodcastShows,
} from "@/services/podcast-public.service"
import { PodcastEpisodePlayer } from "./episode-player"

function pathFor(segments: string[] = []) {
  if (
    segments.length > 2 ||
    segments.some((slug) => !/^[\p{L}\p{N}_-]{1,200}$/u.test(slug))
  )
    notFound()
  return `/podcasts${segments.length ? `/${segments.map(encodeURIComponent).join("/")}` : ""}`
}
const loadPage = cache(
  async (locale?: string, showSlug?: string, episodeSlug?: string) => {
    const path = pathFor(
      [showSlug, episodeSlug].filter((value): value is string => Boolean(value))
    )
    const theme = await getFrontEndThemeContext({ locale, currentPath: path })
    if (locale && !theme.languages?.some((item) => item.code === locale))
      notFound()
    const show = showSlug
      ? await getPublicPodcastShow(showSlug, theme.locale!)
      : null
    if (showSlug && !show) notFound()
    const episode =
      episodeSlug && show
        ? await getPublicPodcastEpisode(show.id, episodeSlug, theme.locale!)
        : null
    if (episodeSlug && !episode) notFound()
    // Translated show linking is not implemented yet; don't point other languages
    // at a show/episode slug they do not own.
    if (show)
      theme.languages = theme.languages?.map((item) =>
        item.isActive
          ? item
          : {
              ...item,
              url: localizePath("/podcasts", item.code, theme.defaultLocale),
            }
      )
    return { theme, show, episode, path }
  }
)
export async function podcastPageMetadata(
  locale?: string,
  segments: string[] = []
): Promise<Metadata> {
  pathFor(segments)
  const { theme, show, episode, path } = await loadPage(
    locale,
    segments[0],
    segments[1]
  )
  const title =
    episode?.title || show?.name || t("site.podcasts.title", theme, "")
  const description = (
    episode?.summary ||
    show?.description ||
    t("site.podcasts.intro", theme, "")
  ).slice(0, 300)
  return {
    title,
    description,
    alternates: {
      canonical: localizePath(path, theme.locale, theme.defaultLocale),
    },
    openGraph: {
      title,
      description,
      type: "website",
      ...(episode?.artwork || show?.artwork
        ? { images: [episode?.artwork || show!.artwork] }
        : {}),
    },
  }
}
function Artwork({
  src,
  title,
  large = false,
}: {
  src: string
  title: string
  large?: boolean
}) {
  return src ? (
    <img
      src={src}
      alt={title}
      width={1200}
      height={1200}
      loading={large ? "eager" : "lazy"}
      className="aspect-square w-full object-cover"
    />
  ) : (
    <div
      aria-hidden="true"
      className="flex aspect-square items-center justify-center bg-[var(--theme-surface)] text-[var(--theme-muted)]"
    >
      <Headphones size={64} />
    </div>
  )
}
export async function PodcastPages({
  locale,
  segments = [],
  page: inputPage,
}: {
  locale?: string
  segments?: string[]
  page?: string | string[]
}) {
  pathFor(segments)
  const { theme, show, episode, path } = await loadPage(
    locale,
    segments[0],
    segments[1]
  )
  if (locale && locale === theme.defaultLocale)
    redirect(
      `${path}${typeof inputPage === "string" ? `?page=${encodeURIComponent(inputPage)}` : ""}`
    )
  const tr = (key: string) => t(`site.podcasts.${key}`, theme, "")
  const href = (suffix = "") =>
    localizePath(`/podcasts${suffix}`, theme.locale, theme.defaultLocale)
  const [areas, result] = await Promise.all([
    getAllWidgetAreas(),
    show
      ? listPublicPodcastEpisodes(
          show.id,
          theme.locale!,
          episode ? 1 : inputPage
        )
      : listPublicPodcastShows(theme.locale!, inputPage),
  ])
  const settings = getArchiveSettings(theme.mods)
  const footerWidgets = Object.fromEntries(
    [1, 2, 3, 4].map((number) => [
      `col${number}`,
      areas.find((area) => area.id === `footer_${number}`)?.items || [],
    ])
  )
  const list = show
    ? (result as Awaited<ReturnType<typeof listPublicPodcastEpisodes>>)
    : null
  const directory = !show
    ? (result as Awaited<ReturnType<typeof listPublicPodcastShows>>)
    : null
  const pagination = !episode && result.totalPages > 1 && (
    <nav aria-label={tr("pagination")} className="mt-8 flex flex-wrap gap-2">
      {archivePageNumbers(result.totalPages, result.page).map(
        (number, index) =>
          number === null ? (
            <span key={`gap-${index}`}>…</span>
          ) : (
            <Link
              key={number}
              href={`${localizePath(path, theme.locale, theme.defaultLocale)}?page=${number}`}
              aria-current={number === result.page ? "page" : undefined}
              className="border border-[var(--theme-border)] px-4 py-2 aria-[current=page]:bg-[var(--theme-surface)] aria-[current=page]:font-bold"
            >
              {number.toLocaleString(theme.locale)}
            </Link>
          )
      )}
    </nav>
  )
  return (
    <PublicAdminBar siteTitle={theme.siteTitle}>
      <div
        dir={theme.direction || "ltr"}
        lang={theme.locale}
        className="flex min-h-screen flex-col bg-[var(--theme-bg)] text-[var(--theme-text)]"
      >
        <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />
        <SiteHeader theme={theme} />
        <main
          className="mx-auto w-full flex-1 px-4 py-8 sm:px-6 lg:py-12"
          style={{ maxWidth: settings.archiveContentWidth }}
        >
          {show && (
            <nav
              aria-label={tr("breadcrumb")}
              className="mb-8 flex flex-wrap gap-3 text-sm text-[var(--theme-muted)]"
            >
              <Link className="hover:underline" href={href()}>
                {tr("title")}
              </Link>
              <span aria-hidden="true">/</span>
              {episode ? (
                <Link
                  className="hover:underline"
                  href={href(`/${encodeURIComponent(show.slug)}`)}
                >
                  {show.name}
                </Link>
              ) : (
                <span aria-current="page">{show.name}</span>
              )}
            </nav>
          )}
          {directory && (
            <>
              <h1 className="text-4xl font-bold text-[var(--theme-heading)]">
                {tr("title")}
              </h1>
              <p className="mt-3 mb-8 max-w-2xl text-[var(--theme-muted)]">
                {tr("intro")}
              </p>
              {directory.items.length ? (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {directory.items.map((item) => (
                    <article key={item.id}>
                      <Link
                        href={href(`/${encodeURIComponent(item.slug)}`)}
                        className="group block"
                      >
                        <Artwork src={item.artwork} title={item.name} />
                        <h2 className="mt-4 text-xl font-bold text-[var(--theme-heading)] group-hover:underline">
                          {item.name}
                        </h2>
                      </Link>
                      {item.presenters && (
                        <p className="mt-2 text-sm text-[var(--theme-muted)]">
                          {item.presenters}
                        </p>
                      )}
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>{tr("no_shows")}</p>
              )}
            </>
          )}
          {show && (
            <>
              <header className="mb-10 grid items-start gap-6 border-b border-[var(--theme-border)] pb-8 sm:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
                <div className="w-40 sm:w-full">
                  <Artwork
                    src={episode?.artwork || show.artwork}
                    title={episode?.title || show.name}
                    large
                  />
                </div>
                <div className="min-w-0">
                  {episode && (
                    <p className="mb-3 text-sm text-[var(--theme-muted)]">
                      {show.name}
                    </p>
                  )}
                  <h1 className="text-3xl leading-tight font-bold text-[var(--theme-heading)] sm:text-4xl">
                    {episode?.title || show.name}
                  </h1>
                  {show.presenters && (
                    <p className="mt-4 text-[var(--theme-muted)]">
                      {show.presenters}
                    </p>
                  )}
                  {episode && (
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--theme-muted)]">
                      <time dateTime={episode.date}>
                        {new Intl.DateTimeFormat(theme.locale, {
                          dateStyle: "medium",
                          timeZone: theme.timeZone || "UTC",
                        }).format(new Date(episode.date))}
                      </time>
                      {episode.duration != null && (
                        <span>
                          {tr("duration").replace(
                            "{minutes}",
                            Math.ceil(episode.duration / 60).toLocaleString(
                              theme.locale
                            )
                          )}
                        </span>
                      )}
                      {episode.season != null && (
                        <span>
                          {tr("season").replace(
                            "{number}",
                            episode.season.toLocaleString(theme.locale)
                          )}
                        </span>
                      )}
                      {episode.episodeNumber != null && (
                        <span>
                          {tr("episode").replace(
                            "{number}",
                            episode.episodeNumber.toLocaleString(theme.locale)
                          )}
                        </span>
                      )}
                    </div>
                  )}
                  {episode?.summary && (
                    <p className="mt-5 max-w-3xl leading-relaxed">
                      {episode.summary}
                    </p>
                  )}
                  {!episode && (
                    <p className="mt-5 max-w-3xl leading-relaxed whitespace-pre-line">
                      {show.description}
                    </p>
                  )}
                  {!episode && show.website && (
                    <a
                      href={show.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-block underline"
                    >
                      {tr("website")}
                    </a>
                  )}
                </div>
              </header>
              {episode && (
                <article className="mb-12 max-w-4xl space-y-8">
                  <PodcastEpisodePlayer
                    audio={episode.audio}
                    video={episode.video}
                    title={episode.title}
                    dict={theme.dict || {}}
                  />
                  {episode.description && (
                    <div className="text-lg leading-relaxed whitespace-pre-line">
                      {episode.description}
                    </div>
                  )}
                  {episode.transcript && (
                    <details className="border-y border-[var(--theme-border)] py-5">
                      <summary className="cursor-pointer font-bold">
                        {tr("transcript")}
                      </summary>
                      <div className="mt-4 leading-relaxed whitespace-pre-line">
                        {episode.transcript}
                      </div>
                    </details>
                  )}
                  {episode.credits && (
                    <section>
                      <h2 className="mb-3 text-xl font-bold">
                        {tr("credits")}
                      </h2>
                      <p className="leading-relaxed whitespace-pre-line">
                        {episode.credits}
                      </p>
                    </section>
                  )}
                </article>
              )}
              <h2 className="mb-5 text-2xl font-bold text-[var(--theme-heading)]">
                {tr(episode ? "more_episodes" : "episodes")}
              </h2>
              {list &&
              list.items.filter((item) => item.id !== episode?.id).length ? (
                <div>
                  {list!.items
                    .filter((item) => item.id !== episode?.id)
                    .map((item) => (
                      <article
                        key={item.id}
                        className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-t border-[var(--theme-border)] py-6 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6"
                      >
                        <Link
                          href={href(
                            `/${encodeURIComponent(show.slug)}/${encodeURIComponent(item.slug)}`
                          )}
                          tabIndex={-1}
                          aria-hidden="true"
                        >
                          <Artwork
                            src={item.artwork || show.artwork}
                            title=""
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={href(
                              `/${encodeURIComponent(show.slug)}/${encodeURIComponent(item.slug)}`
                            )}
                            className="group inline-flex items-start gap-2"
                          >
                            <Play
                              size={18}
                              aria-hidden="true"
                              className="mt-1 shrink-0"
                            />
                            <h3 className="text-lg font-bold text-[var(--theme-heading)] group-hover:underline sm:text-xl">
                              {item.title}
                            </h3>
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--theme-muted)]">
                            <time dateTime={item.date}>
                              {new Intl.DateTimeFormat(theme.locale, {
                                dateStyle: "medium",
                                timeZone: theme.timeZone || "UTC",
                              }).format(new Date(item.date))}
                            </time>
                            {item.duration != null && (
                              <span>
                                {tr("duration").replace(
                                  "{minutes}",
                                  Math.ceil(item.duration / 60).toLocaleString(
                                    theme.locale
                                  )
                                )}
                              </span>
                            )}
                          </div>
                          {item.summary && (
                            <p className="mt-3 line-clamp-3 max-w-3xl leading-relaxed">
                              {item.summary}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <p className="text-[var(--theme-muted)]">{tr("no_episodes")}</p>
              )}
            </>
          )}
          {pagination}
        </main>
        <SiteFooter theme={theme} footerWidgets={footerWidgets} />
      </div>
    </PublicAdminBar>
  )
}
