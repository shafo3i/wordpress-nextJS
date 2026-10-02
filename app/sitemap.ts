import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/services/sitemap.service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return await getSitemapEntries();
}
