"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  Upload,
  FileUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { importFileAction } from "../actions"

interface ImportFormProps {
  dict: Record<string, string>
}

export function ImportForm({ dict }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    postsImported: number
    pagesImported: number
    categoriesImported: number
    tagsImported: number
    commentsImported: number
    skippedCount: number
    type: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setResult(null)
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError(dict["admin.tools.select_file_error"] || "")
      return
    }

    if (file.size > 20 * 1024 * 1024 || !/\.(xml|json)$/i.test(file.name)) {
      setError(dict["admin.tools.error.import_file"])
      return
    }
    setIsUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await importFileAction(formData)

      if (!res.success || !res.result) {
        throw new Error(res.error || dict["admin.tools.error.failed"])
      }

      setResult({
        postsImported: res.result.postsImported || 0,
        pagesImported: res.result.pagesImported || 0,
        categoriesImported: res.result.categoriesImported || 0,
        tagsImported: res.result.tagsImported || 0,
        commentsImported: res.result.commentsImported || 0,
        skippedCount: res.result.skippedCount || 0,
        type: res.type || "xml",
      })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch {
      setError(dict["admin.tools.error.failed"] || "")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="space-y-5 rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {dict["admin.tools.import_wxr_title"] || ""}
          </h2>
          <p className="mt-1 text-[13px] text-[#50575e]">
            {dict["admin.tools.import_wxr_desc"] || ""}
          </p>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-[4px] border-2 border-dashed border-[#c3c4c7] bg-[#f6f7f7] p-8 text-center transition-colors hover:border-[#2271b1] hover:bg-[#f0f6fc]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.json,text/xml,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <FileUp className="size-10 text-[#2271b1]" />
            <div className="text-[14px] font-medium text-[#1d2327]">
              {file ? (
                <span className="font-semibold text-[#2271b1]">
                  {file.name}
                </span>
              ) : (
                <span>{dict["admin.tools.drag_drop_text"] || ""}</span>
              )}
            </div>
            <span className="text-[12px] text-[#646970]">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : dict["admin.tools.file_types_supported"] || ""}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-[3px] border border-[#d63638] bg-[#fcf0f1] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <div>
              <span className="block font-semibold">
                {dict["admin.tools.import_failed"] || ""}
              </span>
              <span className="text-[12px]">{error}</span>
            </div>
          </div>
        )}

        {/* Success summary */}
        {result && (
          <div className="space-y-3 rounded-[3px] border border-[#00a32a] bg-[#edfaef] p-4 text-[13px] text-[#1d2327]">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#00a32a]">
              <CheckCircle className="size-5" />
              <span>{dict["admin.tools.import_success"] || ""}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3 md:grid-cols-6">
              <div className="rounded border border-[#b2e2bd] bg-white p-2.5 text-center">
                <span className="block text-[11px] font-medium text-[#646970]">
                  {dict["admin.posts.title"] || ""}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">
                  {result.postsImported}
                </span>
              </div>
              <div className="rounded border border-[#b2e2bd] bg-white p-2.5 text-center">
                <span className="block text-[11px] font-medium text-[#646970]">
                  {dict["admin.menu.pages"] || ""}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">
                  {result.pagesImported}
                </span>
              </div>
              <div className="rounded border border-[#b2e2bd] bg-white p-2.5 text-center">
                <span className="block text-[11px] font-medium text-[#646970]">
                  {dict["admin.posts.table.categories"] || ""}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">
                  {result.categoriesImported}
                </span>
              </div>
              <div className="rounded border border-[#b2e2bd] bg-white p-2.5 text-center">
                <span className="block text-[11px] font-medium text-[#646970]">
                  {dict["admin.posts.table.tags"] || ""}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">
                  {result.tagsImported}
                </span>
              </div>
              <div className="rounded border border-[#b2e2bd] bg-white p-2.5 text-center">
                <span className="block text-[11px] font-medium text-[#646970]">
                  {dict["admin.posts.table.comments"] || ""}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">
                  {result.commentsImported}
                </span>
              </div>
              <div className="rounded border border-[#b2e2bd] bg-white p-2.5 text-center">
                <span className="block text-[11px] font-medium text-[#646970]">
                  {dict["admin.tools.skipped"] || ""}
                </span>
                <span className="text-xl font-bold text-[#50575e]">
                  {result.skippedCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Link
                href="/admincp/posts"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2271b1] hover:underline"
              >
                {dict["admin.tools.view_imported_posts"] || ""}{" "}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-[#f0f0f1] pt-4">
          <button
            type="button"
            disabled={!file || isUploading}
            onClick={handleImport}
            className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#135e96] disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict["admin.tools.uploading_processing"] || ""}
              </>
            ) : (
              <>
                <Upload className="size-4" />
                {dict["admin.tools.upload_and_import"] || ""}
              </>
            )}
          </button>

          <span className="text-[12px] text-[#646970]">
            {dict["admin.tools.content_import.size_limit"] || ""}
          </span>
        </div>
      </div>

      {/* Guide Information Card */}
      <div className="space-y-3 rounded-[3px] border border-[#dcdcde] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <h3 className="text-[14px] font-semibold text-[#1d2327]">
          {dict["admin.tools.import_guidelines"] || ""}
        </h3>
        <ul className="space-y-2 text-[13px] text-[#50575e]">
          <li className="flex items-start gap-2">
            <span className="font-bold text-[#2271b1]">•</span>
            <span>{dict["admin.tools.guide_1"] || ""}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[#2271b1]">•</span>
            <span>{dict["admin.tools.guide_2"] || ""}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-[#2271b1]">•</span>
            <span>{dict["admin.tools.content_import.author_policy"] || ""}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
