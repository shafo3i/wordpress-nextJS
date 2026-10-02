"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Upload, FileUp, CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { importFileAction } from "../actions";

interface ImportFormProps {
  dict: Record<string, string>;
}

export function ImportForm({ dict }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    postsImported: number;
    pagesImported: number;
    categoriesImported: number;
    tagsImported: number;
    commentsImported: number;
    skippedCount: number;
    type: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError(dict["admin.tools.select_file_error"] || "Please select a file to import.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await importFileAction(formData);

      if (!res.success || !res.result) {
        throw new Error(res.error || "Failed to process import file.");
      }

      setResult({
        postsImported: res.result.postsImported || 0,
        pagesImported: res.result.pagesImported || 0,
        categoriesImported: res.result.categoriesImported || 0,
        tagsImported: res.result.tagsImported || 0,
        commentsImported: res.result.commentsImported || 0,
        skippedCount: res.result.skippedCount || 0,
        type: res.type || "xml",
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during import.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="rounded-[3px] border border-[#dcdcde] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-5">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {dict["admin.tools.import_wxr_title"] || "Import WordPress WXR or JSON File"}
          </h2>
          <p className="text-[13px] text-[#50575e] mt-1">
            {dict["admin.tools.import_wxr_desc"] ||
              "Upload a WordPress eXtended RSS (.xml) file from another WordPress site or a PressForge (.json) archive. Posts, categories, tags, and comments will be parsed and safely inserted."}
          </p>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#c3c4c7] hover:border-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f6fc] rounded-[4px] p-8 text-center cursor-pointer transition-colors"
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
                <span className="text-[#2271b1] font-semibold">{file.name}</span>
              ) : (
                <span>
                  {dict["admin.tools.drag_drop_text"] || "Choose a file from your computer or drag it here"}
                </span>
              )}
            </div>
            <span className="text-[12px] text-[#646970]">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : (dict["admin.tools.file_types_supported"] || "Supports .xml (WordPress export) and .json files")}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-[3px] bg-[#fcf0f1] border border-[#d63638] p-3 text-[13px] text-[#d63638]">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold block">{dict["admin.tools.import_failed"] || "Import failed"}</span>
              <span className="text-[12px]">{error}</span>
            </div>
          </div>
        )}

        {/* Success summary */}
        {result && (
          <div className="rounded-[3px] bg-[#edfaef] border border-[#00a32a] p-4 text-[13px] text-[#1d2327] space-y-3">
            <div className="flex items-center gap-2 text-[#00a32a] font-semibold text-[14px]">
              <CheckCircle className="size-5" />
              <span>{dict["admin.tools.import_success"] || "Import completed successfully!"}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              <div className="bg-white rounded border border-[#b2e2bd] p-2.5 text-center">
                <span className="text-[11px] text-[#646970] block font-medium">
                  {dict["admin.posts.title"] || "Posts"}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">{result.postsImported}</span>
              </div>
              <div className="bg-white rounded border border-[#b2e2bd] p-2.5 text-center">
                <span className="text-[11px] text-[#646970] block font-medium">
                  {dict["admin.menu.pages"] || "Pages"}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">{result.pagesImported}</span>
              </div>
              <div className="bg-white rounded border border-[#b2e2bd] p-2.5 text-center">
                <span className="text-[11px] text-[#646970] block font-medium">
                  {dict["admin.posts.table.categories"] || "Categories"}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">{result.categoriesImported}</span>
              </div>
              <div className="bg-white rounded border border-[#b2e2bd] p-2.5 text-center">
                <span className="text-[11px] text-[#646970] block font-medium">
                  {dict["admin.posts.table.tags"] || "Tags"}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">{result.tagsImported}</span>
              </div>
              <div className="bg-white rounded border border-[#b2e2bd] p-2.5 text-center">
                <span className="text-[11px] text-[#646970] block font-medium">
                  {dict["admin.posts.table.comments"] || "Comments"}
                </span>
                <span className="text-xl font-bold text-[#1d2327]">{result.commentsImported}</span>
              </div>
              <div className="bg-white rounded border border-[#b2e2bd] p-2.5 text-center">
                <span className="text-[11px] text-[#646970] block font-medium">
                  {dict["admin.tools.skipped"] || "Skipped (Existing)"}
                </span>
                <span className="text-xl font-bold text-[#50575e]">{result.skippedCount}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/admincp/posts"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#2271b1] hover:underline font-semibold"
              >
                {dict["admin.tools.view_imported_posts"] || "View Posts in Admin"} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-[#f0f0f1] pt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={!file || isUploading}
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {dict["admin.tools.uploading_processing"] || "Uploading & Importing Content..."}
              </>
            ) : (
              <>
                <Upload className="size-4" />
                {dict["admin.tools.upload_and_import"] || "Upload file and import"}
              </>
            )}
          </button>

          <span className="text-[12px] text-[#646970]">
            {dict["admin.tools.max_size_hint"] || "Maximum upload file size: 64 MB"}
          </span>
        </div>
      </div>

      {/* Guide Information Card */}
      <div className="rounded-[3px] border border-[#dcdcde] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.04)] space-y-3">
        <h3 className="text-[14px] font-semibold text-[#1d2327]">
          {dict["admin.tools.import_guidelines"] || "Import Guidelines & WordPress Compatibility"}
        </h3>
        <ul className="space-y-2 text-[13px] text-[#50575e]">
          <li className="flex items-start gap-2">
            <span className="text-[#2271b1] font-bold">•</span>
            <span>
              {dict["admin.tools.guide_1"] ||
                "If you are migrating from a real WordPress website, go to Tools → Export in that site, select 'All content', download the .xml file, and upload it directly here."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2271b1] font-bold">•</span>
            <span>
              {dict["admin.tools.guide_2"] ||
                "Duplicate prevention: Posts matching an existing slug (URL) and type are safely skipped to avoid overwriting current articles."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#2271b1] font-bold">•</span>
            <span>
              {dict["admin.tools.guide_3"] ||
                "Authors in the import file are automatically attributed to your logged-in administrator account while preserving author display names."}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
