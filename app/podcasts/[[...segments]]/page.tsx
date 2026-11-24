import {
  PodcastPages,
  podcastPageMetadata,
} from "@/components/site/podcasts/podcast-pages"
export const dynamic = "force-dynamic"
type Props = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ page?: string | string[] }>
}
export async function generateMetadata({ params }: Props) {
  return podcastPageMetadata(undefined, (await params).segments)
}
export default async function Page({ params, searchParams }: Props) {
  return (
    <PodcastPages
      segments={(await params).segments}
      page={(await searchParams).page}
    />
  )
}
