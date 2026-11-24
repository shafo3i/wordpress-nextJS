import {
  PodcastPages,
  podcastPageMetadata,
} from "@/components/site/podcasts/podcast-pages"
export const dynamic = "force-dynamic"
type Props = {
  params: Promise<{ lang: string; segments?: string[] }>
  searchParams: Promise<{ page?: string | string[] }>
}
export async function generateMetadata({ params }: Props) {
  const { lang, segments } = await params
  return podcastPageMetadata(lang, segments)
}
export default async function Page({ params, searchParams }: Props) {
  const { lang, segments } = await params
  return (
    <PodcastPages
      locale={lang}
      segments={segments}
      page={(await searchParams).page}
    />
  )
}
