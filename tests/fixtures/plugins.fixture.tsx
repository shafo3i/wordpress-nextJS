import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PluginConfigForm } from "@/app/(admin)/admincp/plugins/[slug]/_components/plugin-config-form"
import { NewsletterBlock } from "@/components/site/blocks/newsletter"
import { DEFAULT_THEME } from "@/components/site/utils"
export function mount(
  dict: Record<string, string>,
  locale: string,
  kind: string
) {
  const theme = {
    ...DEFAULT_THEME,
    dict,
    locale,
    direction: locale === "ar" ? ("rtl" as const) : ("ltr" as const),
  }
  createRoot(document.getElementById("fixture")!).render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {kind === "signup" ? (
        <NewsletterBlock title={dict["site.newsletter"]} theme={theme} />
      ) : (
        <PluginConfigForm
          slug={kind}
          manifest={{
            slug: kind,
            name: "",
            description: "",
            version: "1",
            author: "",
          }}
          config={
            kind === "related-posts"
              ? {
                  count: 3,
                  matchStrategy: "categories",
                  displayStyle: "list",
                  showThumbnail: true,
                  showDate: true,
                }
              : {}
          }
          dict={dict}
          direction={theme.direction}
          defaultLocale={locale}
          canManage
          languages={[{ code: locale, name: locale }]}
        />
      )}
    </QueryClientProvider>
  )
}
