"use client"
import { authFlowUrl } from "@/lib/auth-navigation"
import type { usePostAutosave } from "@/lib/use-post-autosave"
export function PostAutosaveNotice({
  autosave,
  dict = {},
  locale,
}: {
  autosave: ReturnType<typeof usePostAutosave>
  dict?: Record<string, string>
  locale: string
}) {
  if (!autosave.enabled) return null
  return (
    <div
      className="space-y-2 border border-[#c3c4c7] bg-[#f6f7f7] p-3 text-xs text-[#50575e]"
      aria-live="polite"
    >
      <p>{dict[`admin.editor.autosave.${autosave.status}`]}</p>
      <p>{dict["admin.editor.autosave.explanation"]}</p>
      {autosave.storageFailed && (
        <p role="alert">{dict["admin.editor.autosave.storage_failed"]}</p>
      )}
      {autosave.candidate && (
        <div role="alert" className="space-y-2">
          <p>
            {dict["admin.editor.autosave.recovery"]}{" "}
            {new Date(autosave.candidate.savedAt).toLocaleString(locale)}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={autosave.restore}
              className="text-[#2271b1] underline"
            >
              {dict["admin.editor.autosave.restore"]}
            </button>
            <button
              type="button"
              onClick={autosave.keepCurrent}
              className="text-[#2271b1] underline"
            >
              {dict["admin.editor.autosave.keep_current"]}
            </button>
          </div>
        </div>
      )}
      {(autosave.status === "expired" ||
        autosave.status === "account_changed") && (
        <a
          href={authFlowUrl(
            "/cms-admin",
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "/admincp/posts",
            "/cms-admin",
            locale
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2271b1] underline"
        >
          {dict["admin.session.sign_in"]}
        </a>
      )}
    </div>
  )
}
