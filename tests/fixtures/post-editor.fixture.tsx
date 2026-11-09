import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClassicPostEditor } from "../../components/admin/posts/editor/classic-post-editor"
import { ArticleShare } from "../../components/site/article-share"
import { AdminSessionMonitor } from "../../components/admin/admin-session-monitor"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"

let root: ReturnType<typeof createRoot>,
  shouldFail = false
const submissions: Record<string, FormDataEntryValue>[] = []
export const failSave = (fail: boolean) => {
  shouldFail = fail
}
export const saved = () => submissions
export function render(locale: "ar" | "en", existing = true) {
  root ??= createRoot(document.getElementById("fixture")!)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const dict = locale === "ar" ? ar : en
  root.render(
    <QueryClientProvider client={client}>
      <AdminSessionMonitor userId="editor-a" dict={dict} />
      <ClassicPostEditor
        key={`${locale}:${existing}`}
        autosaveUserId="editor-a"
        uiLocale={locale}
        autosaveDocument="new:12345678-1234-4234-8234-123456789abc"
        postId={existing ? "1" : undefined}
        initialModifiedAt={existing ? "2026-11-09T12:00:00.000Z" : ""}
        initialTitle={existing ? "Stored title" : ""}
        initialContent={existing ? "<p>Stored content</p>" : ""}
        initialStatus={existing ? "publish" : "draft"}
        initialLanguageCode={locale}
        initialPostPassword="existing-password"
        initialCommentStatus="closed"
        initialPingStatus="closed"
        dict={dict}
        direction={locale === "ar" ? "rtl" : "ltr"}
        languages={[
          {
            code: "en",
            name: "English",
            nativeName: "English",
            direction: "ltr",
            isDefault: false,
          },
          {
            code: "ar",
            name: "Arabic",
            nativeName: "Arabic",
            direction: "rtl",
            isDefault: true,
          },
        ]}
        action={async (form) => {
          if (shouldFail)
            return { success: false, error: "admin.editor.save_failed" }
          submissions.push(Object.fromEntries(form))
          return { success: true, postId: existing ? "1" : "2" }
        }}
      />
    </QueryClientProvider>
  )
}
export function shares(locale: "ar" | "en", facebook = true) {
  root ??= createRoot(document.getElementById("fixture")!)
  root.render(
    <ArticleShare
      title="A & B / news"
      url="https://site.test/en/posts/story"
      mods={{ singleShareFacebook: facebook }}
      dict={locale === "ar" ? ar : en}
    />
  )
}
