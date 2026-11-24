import { notFound } from "next/navigation"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  podcastShowQuerySchema,
  podcastShowIdSchema,
} from "@/db/schema/cms-podcasts"
import { getMediaItemDetails } from "@/services/media-details.service"
import { getSafeStudioUrl } from "@/lib/studio/urls"
import { getPodcastShows } from "./query"
import { ShowForm, ShowFilter, ShowTable } from "./_components"

export const dynamic = "force-dynamic"
export default async function PodcastShowsPage({
  searchParams,
}: {
  searchParams: Promise<{
    s?: string
    lang?: string
    page?: string
    edit?: string
    saved?: string
  }>
}) {
  await verifyAdmin()
  const params = await searchParams
  const parsed = podcastShowQuerySchema.safeParse({
    search: params.s,
    language: params.lang,
    page: params.page,
  })
  if (
    !parsed.success ||
    (params.edit && !podcastShowIdSchema.safeParse(params.edit).success)
  )
    notFound()
  const context = await getAdminLanguageContext()
  const result = await getPodcastShows(parsed.data)
  const show = params.edit
    ? (await getPodcastShows({ id: params.edit })).items[0]
    : undefined
  if (params.edit && !show) notFound()
  const image = show?.artworkId
    ? await getMediaItemDetails(Number(show.artworkId))
    : null
  const artworkUrl = image?.mimeType.startsWith("image/")
    ? getSafeStudioUrl(image.url, true)
    : ""
  const dict = context.dict
  const languages = context.allLanguages.filter((language) => language.isActive)
  return (
    <AdminShell>
      <h1 className="mb-3 text-[23px] font-normal text-[#1d2327]">
        {dict["admin.podcasts.shows"]}
      </h1>
      <p className="text-[13px] text-[#646970]">
        {dict["admin.podcasts.shows_help"]}
      </p>
      {params.saved === "1" && (
        <p
          role="status"
          className="my-3 border-s-4 border-[#00a32a] bg-white p-3"
        >
          {dict["admin.podcasts.saved"]}
        </p>
      )}
      <ShowFilter
        search={parsed.data.search}
        language={parsed.data.language}
        languages={context.allLanguages}
        dict={dict}
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[320px_1fr]">
        <ShowForm
          key={show?.id || "new"}
          show={show}
          artworkUrl={artworkUrl || ""}
          languages={languages}
          dict={dict}
        />
        <div className="min-w-0">
          <div className="text-[13px]">
            {dict["admin.podcasts.all"]} ({result.total})
          </div>
          <ShowTable
            items={result.items}
            total={result.total}
            page={result.page}
            search={parsed.data.search}
            language={parsed.data.language}
            dict={dict}
          />
        </div>
      </div>
    </AdminShell>
  )
}
