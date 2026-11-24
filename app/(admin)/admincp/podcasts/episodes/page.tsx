import Link from "next/link"
import { notFound } from "next/navigation"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { podcastEpisodeQuerySchema } from "@/db/schema/cms-podcast-episodes"
import { getEpisodes } from "./query"
import { EpisodeFilter, EpisodeTable } from "./_components"
export const dynamic = "force-dynamic"
export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{
    s?: string
    lang?: string
    status?: string
    page?: string
  }>
}) {
  await verifyAdmin()
  const params = await searchParams
  const parsed = podcastEpisodeQuerySchema.safeParse({
    search: params.s,
    language: params.lang,
    status: params.status,
    page: params.page,
  })
  if (!parsed.success) notFound()
  const context = await getAdminLanguageContext()
  const result = await getEpisodes(parsed.data)
  const dict = context.dict
  return (
    <AdminShell>
      <div className="flex items-center gap-3">
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          {dict["admin.podcasts.episodes"]}
        </h1>
        <Link
          href="/admincp/podcasts/episodes/new"
          className="rounded-[3px] border border-[#2271b1] px-3 py-1 text-[13px] text-[#2271b1]"
        >
          {dict["admin.podcasts.add_episode"]}
        </Link>
      </div>
      <EpisodeFilter
        search={parsed.data.search}
        language={parsed.data.language}
        status={parsed.data.status}
        languages={context.allLanguages}
        dict={dict}
      />
      <EpisodeTable
        {...result}
        search={parsed.data.search}
        language={parsed.data.language}
        status={parsed.data.status}
        dict={dict}
      />
    </AdminShell>
  )
}
