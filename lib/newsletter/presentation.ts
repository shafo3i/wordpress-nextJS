import { getActivePluginSlugs } from "@/services/plugin.service"
import { getPluginConfig } from "@/lib/plugins/config"
import { getDefaultLanguage } from "@/services/language.service"
export type NewsletterPresentation = {
  brandName?: string
  pitch?: string
  buttonText?: string
}
export async function getArticleNewsletter(
  locale: string
): Promise<NewsletterPresentation | undefined> {
  if (!(await getActivePluginSlugs()).includes("newsletter")) return undefined
  const config = await getPluginConfig("newsletter")
  const defaultLanguage = await getDefaultLanguage()
  const wording =
    locale === defaultLanguage?.code
      ? config
      : config.translations?.[locale] || {}
  return {
    brandName: typeof wording.brandName === "string" ? wording.brandName : "",
    pitch: typeof wording.pitch === "string" ? wording.pitch : "",
    buttonText:
      typeof wording.buttonText === "string" ? wording.buttonText : "",
  }
}
