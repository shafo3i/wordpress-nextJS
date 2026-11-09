import { and, countDistinct, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '@/db'
import { wpPosts, postTranslationsTable } from '@/db/schema'
import { getPublishedContent } from '@/lib/site-content'

export type SearchParams = { q?: string | string[]; page?: string | string[] }

export function normalizePostSearch(params: SearchParams) {
  const query = typeof params.q === 'string' ? params.q.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 160) : ''
  const numeric = typeof params.page === 'string' && /^\d+$/.test(params.page) ? Number(params.page) : 1
  return { query, page: Number.isSafeInteger(numeric) && numeric > 0 ? numeric : 1 }
}

export function searchPattern(query: string) {
  return `%${query.replace(/[\\%_]/g, '\\$&')}%`
}

export async function searchPublishedPosts(params: SearchParams, locale: string, perPage = 12) {
  const { query, page } = normalizePostSearch(params)
  if (!query) return { query, posts: [], total: 0, totalPages: 0, page: 1 }
  const limit = Number.isFinite(perPage) ? Math.min(36, Math.max(1, Math.trunc(perPage))) : 12
  const pattern = searchPattern(query)
  const where = and(
    eq(wpPosts.postType, 'post'),
    eq(wpPosts.postStatus, 'publish'),
    eq(wpPosts.postPassword, ''),
    eq(postTranslationsTable.languageCode, locale),
    or(ilike(wpPosts.postTitle, pattern), ilike(wpPosts.postExcerpt, pattern), ilike(wpPosts.postContent, pattern)),
  )
  const [row] = await db.select({ total: countDistinct(wpPosts.id) }).from(wpPosts)
    .innerJoin(postTranslationsTable, eq(wpPosts.id, postTranslationsTable.postId)).where(where)
  const total = Number(row?.total || 0)
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const rows = await db.selectDistinct({ id:wpPosts.id, date:wpPosts.postDate }).from(wpPosts)
    .innerJoin(postTranslationsTable, eq(wpPosts.id, postTranslationsTable.postId)).where(where)
    .orderBy(desc(wpPosts.postDate), desc(wpPosts.id)).limit(limit).offset((currentPage - 1) * limit)
  const posts = await getPublishedContent('post', undefined, limit, locale, rows.map(row => row.id))
  return { query, posts, total, totalPages, page: currentPage }
}
