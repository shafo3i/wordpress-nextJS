import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getFrontEndThemeContext } from '@/lib/site-theme'
import { normalizePostSearch, searchPublishedPosts, type SearchParams } from '@/lib/post-search'
import { getArchiveSettings, archivePageNumbers } from '@/lib/customizer/archive'
import { SiteHeader } from '@/components/site/header/site-header'
import { SiteFooter } from '@/components/site/footer/site-footer'
import { ThemeDynamicStyles } from '@/components/site/theme-dynamic-styles'
import { CategoryCard } from './category-card'
import { localizePath, t } from '@/components/site/utils'
import { getAllWidgetAreas } from '@/lib/widgets/db'

export async function SearchResults({ params, locale }: { params: SearchParams; locale?: string }) {
  const input = normalizePostSearch(params)
  const theme = await getFrontEndThemeContext({ locale, currentPath: `/search${input.query ? `?q=${encodeURIComponent(input.query)}` : ''}` })
  if (locale && !theme.languages?.some(language => language.code === locale)) notFound()
  if (locale && locale === theme.defaultLocale) redirect(`/search${input.query ? `?q=${encodeURIComponent(input.query)}&page=${input.page}` : ''}`)
  const settings = getArchiveSettings(theme.mods)
  const [result, areas] = await Promise.all([searchPublishedPosts(params, theme.locale!, settings.archivePostsPerPage), getAllWidgetAreas()])
  const footerWidgets = {
    col1: areas.find(area => area.id === 'footer_1')?.items || [],
    col2: areas.find(area => area.id === 'footer_2')?.items || [],
    col3: areas.find(area => area.id === 'footer_3')?.items || [],
    col4: areas.find(area => area.id === 'footer_4')?.items || [],
  }
  const columns = settings.archiveLayout === 'list' || settings.archiveColumns === 1 ? '' : settings.archiveColumns === 2 ? 'sm:grid-cols-2' : settings.archiveColumns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
  const action = localizePath('/search', theme.locale, theme.defaultLocale)
  const href = (page: number) => `${action}?${new URLSearchParams({q:result.query,page:String(page)})}`
  return <div dir={theme.direction || 'ltr'} className="flex min-h-screen flex-col bg-[var(--theme-bg)] text-[var(--theme-text)]">
    <ThemeDynamicStyles mods={theme.mods} themeSlug={theme.themeSlug} />
    <SiteHeader theme={theme} />
    <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-6" style={{maxWidth:settings.archiveContentWidth}}>
      <h1 className="mb-5 text-2xl font-bold text-[var(--theme-heading)]">{t('site.search.label', theme, '')}</h1>
      <form role="search" method="get" action={action} className="mb-6 flex flex-wrap gap-2">
        <label htmlFor="post-search" className="sr-only">{t('site.search.label', theme, '')}</label>
        <input id="post-search" type="search" name="q" defaultValue={result.query} maxLength={160} required placeholder={t('site.search.placeholder', theme, '')} className="min-w-0 flex-1 border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2" />
        <button type="submit" className="border border-[var(--theme-border)] bg-[var(--theme-primary)] px-5 py-2 text-[var(--theme-on-primary)]">{t('site.search.submit', theme, '')}</button>
      </form>
      {result.query ? <>
        <p role="status" className="mb-5 text-sm text-[var(--theme-muted)]">{t('site.search.results', theme, '').replace('{count}', result.total.toLocaleString(theme.locale)).replace('{query}', result.query)}</p>
        {result.posts.length ? <div className={`grid grid-cols-1 gap-5 ${columns}`}>{result.posts.map(post => <CategoryCard key={post.id} post={post} theme={theme} settings={settings} />)}</div> : <p>{t('site.search.empty', theme, '')}</p>}
        {result.totalPages > 1 && <nav aria-label={t('site.search.pagination', theme, '')} className="mt-6 flex flex-wrap gap-2">
          {archivePageNumbers(result.totalPages, result.page).map((page, index) => page === null ? <span key={`gap-${index}`}>…</span> : <Link key={page} href={href(page)} aria-current={page === result.page ? 'page' : undefined} className="border border-[var(--theme-border)] px-3 py-2 aria-[current=page]:font-bold">{page}</Link>)}
        </nav>}
      </> : <p>{t('site.search.hint', theme, '')}</p>}
    </main>
    <SiteFooter theme={theme} footerWidgets={footerWidgets} />
  </div>
}
