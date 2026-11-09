import type { MetadataRoute } from 'next'
import { getSiteSeoOptions } from '@/services/settings.service'
import { siteBaseUrl } from '@/lib/seo/urls'
import { indexingAllowed } from '@/lib/seo/metadata'

export const dynamic='force-dynamic'
export default async function robots():Promise<MetadataRoute.Robots> {
  const options=await getSiteSeoOptions()
  const base=siteBaseUrl(options)
  return {
    rules:indexingAllowed(options) ? {userAgent:'*',allow:'/',disallow:['/admincp/','/api/']} : {userAgent:'*',disallow:'/'},
    sitemap:[`${base}/sitemap.xml`,`${base}/news-sitemap.xml`],
  }
}
