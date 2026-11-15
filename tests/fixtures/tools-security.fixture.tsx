import { createRoot } from "react-dom/client"
import { RedirectManager } from "../../app/(admin)/admincp/tools/redirects/_components/redirect-manager"
import { ExportForm } from "../../app/(admin)/admincp/tools/export/_components/export-form"
import { SearchReplaceForm } from "../../app/(admin)/admincp/tools/search-replace/_components/search-replace-form"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
export function render(locale: "en" | "ar") {
  const dict = locale === "ar" ? ar : en
  ;(globalThis as unknown as { toolsError: string }).toolsError =
    dict["admin.tools.error.failed"]
  createRoot(document.getElementById("fixture")!).render(
    <main dir={locale === "ar" ? "rtl" : "ltr"}>
      <section data-tools-redirect>
        <RedirectManager
          dict={dict}
          initialRedirects={[
            {
              id: "rule-1",
              sourcePath: "/old",
              targetUrl: "javascript:alert(1)",
              statusCode: 301,
              notes: "<script>alert(1)</script>",
              hits: 0,
              createdAt: "2026-01-01T00:00:00Z",
            },
          ]}
        />
      </section>
      <section data-tools-export>
        <ExportForm
          dict={dict}
          categories={[]}
          authors={[]}
          stats={{ posts: 0, pages: 0, comments: 0, categories: 0 }}
        />
      </section>
      <section data-tools-search>
        <SearchReplaceForm dict={dict} />
      </section>
    </main>
  )
}
