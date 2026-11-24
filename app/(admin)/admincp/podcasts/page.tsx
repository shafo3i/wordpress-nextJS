import { redirect } from "next/navigation"
import { verifyAdmin } from "@/lib/authMIddleware"
export default async function PodcastsPage() { await verifyAdmin(); redirect("/admincp/podcasts/shows") }
