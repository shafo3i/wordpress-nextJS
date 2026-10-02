"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  FileText,
  Music,
  Video,
  File as FileIcon,
} from "lucide-react";
import type { MediaItem } from "@/services/media.service";
import { updateMediaAction } from "../actions";

interface AttachmentDetailsModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onUpdate: (updated: MediaItem) => void;
  onDelete: (id: number) => void;
  dict: Record<string, string>;
  direction: "rtl" | "ltr";
}

export function AttachmentDetailsModal({
  item,
  onClose,
  onUpdate,
  onDelete,
  dict,
  direction,
}: AttachmentDetailsModalProps) {
  const [altText, setAltText] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (item) {
      setAltText(item.altText || "");
      setTitle(item.title || "");
      setCaption(item.caption || "");
      setDescription(item.description || "");
      setIsSaved(false);
    }
  }, [item]);

  if (!item) return null;

  async function handleSaveField() {
    if (!item) return;
    setIsSaving(true);
    setIsSaved(false);
    try {
      const res = await updateMediaAction(item.id, {
        altText,
        title,
        caption,
        description,
      });

      if (res.success) {
        setIsSaved(true);
        onUpdate({
          ...item,
          altText,
          title,
          caption,
          description,
        });
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopyUrl() {
    if (!item) return;
    const fullUrl = window.location.origin + item.url;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    if (!item) return;
    const confirmed = window.confirm(
      dict["admin.media.confirm_delete"] ||
        "Are you sure you want to permanently delete this media file? It will be removed from all articles."
    );
    if (confirmed) {
      onDelete(item.id);
      onClose();
    }
  }

  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const isAudio = item.mimeType.startsWith("audio/");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 sm:p-6"
      dir={direction}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded shadow-2xl flex flex-col overflow-hidden border border-[#c3c4c7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#dcdcde] bg-[#f6f7f7]">
          <h2 className="text-base font-bold text-[#1d2327]">
            {dict["admin.media.details_title"] || "Attachment Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#50575e] hover:text-[#1d2327] hover:bg-[#e2e4e7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Column: Media Preview */}
          <div className="md:col-span-7 bg-[#2c3338] p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.title}
                className="max-h-[500px] max-w-full object-contain rounded shadow"
              />
            ) : isVideo ? (
              <video src={item.url} controls className="max-h-[400px] max-w-full rounded" />
            ) : isAudio ? (
              <div className="text-center p-6 bg-white/10 rounded-lg">
                <Music className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <audio src={item.url} controls className="w-full" />
              </div>
            ) : (
              <div className="text-center p-6 text-white/70">
                <FileText className="w-20 h-20 mx-auto mb-3 text-white/50" />
                <p className="text-sm font-semibold">{item.filename}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] text-white text-xs font-semibold rounded hover:bg-[#135e96]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open File</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Details & Edit Fields */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-4 bg-white text-xs">
            {/* Metadata Summary */}
            <div className="border-b border-[#f0f0f1] pb-3 text-[#646970] space-y-1">
              <p>
                <strong className="text-[#1d2327]">
                  {dict["admin.media.file_name"] || "File name"}:
                </strong>{" "}
                <span className="font-mono text-[11px]">{item.filename}</span>
              </p>
              <p>
                <strong className="text-[#1d2327]">
                  {dict["admin.media.file_type"] || "File type"}:
                </strong>{" "}
                {item.mimeType}
              </p>
              <p>
                <strong className="text-[#1d2327]">
                  {dict["admin.media.uploaded_on"] || "Uploaded on"}:
                </strong>{" "}
                {new Date(item.uploadedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {item.width && item.height ? (
                <p>
                  <strong className="text-[#1d2327]">
                    {dict["admin.media.dimensions"] || "Dimensions"}:
                  </strong>{" "}
                  {item.width} by {item.height} pixels
                </p>
              ) : null}
            </div>

            {/* Editable Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.alt_text"] || "Alternative Text"}
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  onBlur={handleSaveField}
                  className="w-full px-2.5 py-1.5 border border-[#8c8f94] rounded text-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                />
                <p className="text-[11px] text-[#646970] mt-1 leading-snug">
                  {dict["admin.media.alt_text_desc"] ||
                    "Describe the purpose of the image for search engines and screen readers."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.title_label"] || "Title"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveField}
                  className="w-full px-2.5 py-1.5 border border-[#8c8f94] rounded text-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.caption"] || "Caption"}
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onBlur={handleSaveField}
                  className="w-full px-2.5 py-1.5 border border-[#8c8f94] rounded text-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.description"] || "Description"}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSaveField}
                  className="w-full px-2.5 py-1.5 border border-[#8c8f94] rounded text-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y"
                />
              </div>

              {/* File URL Copy Field */}
              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.file_url"] || "File URL"}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== "undefined" ? window.location.origin + item.url : item.url}
                    className="flex-1 px-2.5 py-1.5 bg-[#f6f7f7] border border-[#dcdcde] rounded text-[11px] font-mono text-[#50575e] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-2.5 py-1.5 bg-white border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f6fc] rounded text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? dict["admin.media.url_copied"] || "Copied!" : dict["admin.media.copy_url"] || "Copy URL"}</span>
                  </button>
                </div>
              </div>

              {/* Status / Saved Indicator */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#2271b1] font-medium">
                  {isSaving ? dict["admin.media.saving"] || "Saving..." : isSaved ? dict["admin.media.saved"] || "Saved." : ""}
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-medium text-[#b32d2e] hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{dict["admin.media.delete_permanently"] || "Delete permanently"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
