import { SearchResults } from '@/components/site/templates/search-results'
import type { SearchParams } from '@/lib/post-search'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index:false, follow:true } }

export default async function SearchPage({ searchParams }: { searchParams:Promise<SearchParams> }) {
  return <SearchResults params={await searchParams} />
}
