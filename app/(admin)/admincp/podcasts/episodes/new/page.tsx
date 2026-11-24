import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { EpisodeForm } from "../_components/episode-form"
export const dynamic = "force-dynamic"
export default async function NewEpisodePage() {
  await verifyAdmin()
  const context = await getAdminLanguageContext()
  return (
    <AdminShell>
      <h1 className="mb-5 text-[23px] font-normal text-[#1d2327]">
        {context.dict["admin.podcasts.add_episode"]}
      </h1>
      <EpisodeForm
        languages={context.allLanguages}
        defaultLanguage={
          context.allLanguages.find((item) => item.isDefault)?.code ||
          context.allLanguages[0]?.code ||
          ""
        }
        dict={context.dict}
      />
    </AdminShell>
  )
}
