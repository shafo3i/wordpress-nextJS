import { notFound } from "next/navigation"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { podcastShowIdSchema } from "@/db/schema/cms-podcasts"
import { getEpisode } from "../../query"
import { EpisodeForm } from "../../_components/episode-form"
export const dynamic = "force-dynamic"
export default async function EditEpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  await verifyAdmin()
  const { id } = await params
  if (!podcastShowIdSchema.safeParse(id).success) notFound()
  const episode = await getEpisode(id)
  if (!episode) notFound()
  const context = await getAdminLanguageContext()
  const query = await searchParams
  return (
    <AdminShell>
      <h1 className="mb-5 text-[23px] font-normal text-[#1d2327]">
        {context.dict["admin.podcasts.edit_episode"]}
      </h1>
      {query.saved === "1" && (
        <p
          role="status"
          className="mb-4 border-s-4 border-[#00a32a] bg-white p-3"
        >
          {context.dict["admin.podcasts.episode_saved"]}
        </p>
      )}
      <EpisodeForm
        key={episode.id}
        episode={episode}
        languages={context.allLanguages}
        defaultLanguage={episode.languageCode}
        dict={context.dict}
      />
    </AdminShell>
  )
}
