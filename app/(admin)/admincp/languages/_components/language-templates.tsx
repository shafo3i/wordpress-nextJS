"use client"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { installLanguageTemplateAction } from "../action"

export function LanguageTemplates({ templates, dict }: {
  templates: { code: string; name: string; nativeName: string; direction: string }[]
  dict: Record<string, string>
}) {
  const router = useRouter()
  const [code, setCode] = useState(templates[0]?.code || "")
  const [isDefault, setDefault] = useState(false)
  const [message, setMessage] = useState("")
  const install = useMutation({
    mutationFn: () => installLanguageTemplateAction({ code, isDefault }),
    onSuccess: result => {
      setMessage(dict[result.success ? "admin.languages.templates.success" : "admin.languages.templates.failed"])
      if (result.success) router.refresh()
    },
    onError: () => setMessage(dict["admin.languages.templates.failed"]),
  })
  return <section id="language-templates" className="space-y-3 border border-[#c3c4c7] bg-white p-4 text-[13px]">
    <h2 className="font-semibold">{dict["admin.languages.templates.title"]}</h2>
    <p>{dict["admin.languages.templates.help"]}</p>
    <form onSubmit={event => { event.preventDefault(); install.mutate() }} className="flex flex-wrap items-center gap-3">
      <label htmlFor="language-template">{dict["admin.languages.templates.select"]}</label>
      <select id="language-template" value={code} disabled={install.isPending} onChange={event => setCode(event.target.value)} className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2">
        {templates.map(template => <option key={template.code} value={template.code}>{template.name} — {template.nativeName} ({template.code})</option>)}
      </select>
      <label className="flex items-center gap-2"><input type="checkbox" checked={isDefault} disabled={install.isPending} onChange={event => setDefault(event.target.checked)} />{dict["admin.languages.templates.default"]}</label>
      <button disabled={!code || install.isPending} className="h-[30px] rounded-[3px] bg-[#2271b1] px-3 text-white disabled:opacity-50">{dict[install.isPending ? "admin.languages.templates.loading" : "admin.languages.templates.install"]}</button>
    </form>
    {!templates.length && <p>{dict["admin.languages.templates.empty"]}</p>}
    {message && <p role="status">{message}</p>}
  </section>
}
