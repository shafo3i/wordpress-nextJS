"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  FileText,
  Music,
} from "lucide-react";
import type { MediaItem } from "@/services/media.service";
import { safeMediaUrl } from "@/lib/post-media";
import { updateMediaAction } from "../actions";

interface AttachmentDetailsModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onUpdate: (updated: MediaItem) => void;
  onDelete: (id: number) => Promise<boolean>;
  dict: Record<string, string>;
  direction: "rtl" | "ltr";
}

export function AttachmentDetailsModal(props: AttachmentDetailsModalProps) {
  if (!props.item) return null;
  return <AttachmentDetailsEditor key={props.item.id} {...props} item={props.item} />;
}
function AttachmentDetailsEditor({ item, onClose, onUpdate, onDelete, dict, direction }: AttachmentDetailsModalProps & { item: MediaItem }) {
  const [altText, setAltText] = useState(item.altText || "");
  const [title, setTitle] = useState(item.title || "");
  const [caption, setCaption] = useState(item.caption || "");
  const [description, setDescription] = useState(item.description || "");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  const fileUrl = safeMediaUrl(item.url) || "";
  const displayUrl = fileUrl && typeof window !== "undefined" ? new URL(fileUrl, window.location.origin).href : fileUrl;

  async function handleSaveField() {
    if (!item) return;
    setError("");
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
      } else setError(res.error || dict["admin.media.error_failed"] || "");
    } catch {
      setError(dict["admin.media.error_failed"] || "");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyUrl() {
    if (!fileUrl) return;
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { setError(dict["admin.media.error_failed"] || ""); }
  }

  async function handleDelete() {
    if (!item) return;
    const confirmed = window.confirm(
      dict["admin.media.confirm_delete"] ||
        ""
    );
    if (confirmed) {
      if (await onDelete(item.id)) onClose();
      else setError(dict["admin.media.error_failed"] || "");
    }
  }

  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const isAudio = item.mimeType.startsWith("audio/");

  return (
    <div
      role="dialog" aria-modal="true" aria-label={dict["admin.media.details_title"] || ""}
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
            {dict["admin.media.details_title"] || ""}
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
                src={fileUrl || undefined}
                alt={item.title}
                className="max-h-[500px] max-w-full object-contain rounded shadow"
              />
            ) : isVideo ? (
              <video src={fileUrl || undefined} controls className="max-h-[400px] max-w-full rounded" />
            ) : isAudio ? (
              <div className="text-center p-6 bg-white/10 rounded-lg">
                <Music className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <audio src={fileUrl || undefined} controls className="w-full" />
              </div>
            ) : (
              <div className="text-center p-6 text-white/70">
                <FileText className="w-20 h-20 mx-auto mb-3 text-white/50" />
                <p className="text-sm font-semibold">{item.filename}</p>
                <a
                  href={fileUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] text-white text-xs font-semibold rounded hover:bg-[#135e96]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{dict["admin.media.open_file"] || ""}</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Details & Edit Fields */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-4 bg-white text-xs">
            {error && <p role="alert" className="text-[#b32d2e]">{error}</p>}
            {/* Metadata Summary */}
            <div className="border-b border-[#f0f0f1] pb-3 text-[#646970] space-y-1">
              <p>
                <strong className="text-[#1d2327]">
                  {dict["admin.media.file_name"] || ""}:
                </strong>{" "}
                <span className="font-mono text-[11px]">{item.filename}</span>
              </p>
              <p>
                <strong className="text-[#1d2327]">
                  {dict["admin.media.file_type"] || ""}:
                </strong>{" "}
                {item.mimeType}
              </p>
              <p>
                <strong className="text-[#1d2327]">
                  {dict["admin.media.uploaded_on"] || ""}:
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
                    {dict["admin.media.dimensions"] || ""}:
                  </strong>{" "}
                  {(dict["admin.media.dimensions_value"] || "").replace("{width}", String(item.width)).replace("{height}", String(item.height))}
                </p>
              ) : null}
            </div>

            {/* Editable Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.alt_text"] || ""}
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
                    ""}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1d2327] mb-1">
                  {dict["admin.media.title_label"] || ""}
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
                  {dict["admin.media.caption"] || ""}
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
                  {dict["admin.media.description"] || ""}
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
                  {dict["admin.media.file_url"] || ""}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={displayUrl}
                    className="flex-1 px-2.5 py-1.5 bg-[#f6f7f7] border border-[#dcdcde] rounded text-[11px] font-mono text-[#50575e] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-2.5 py-1.5 bg-white border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f6fc] rounded text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? dict["admin.media.url_copied"] || "" : dict["admin.media.copy_url"] || ""}</span>
                  </button>
                </div>
              </div>

              {/* Status / Saved Indicator */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#2271b1] font-medium">
                  {isSaving ? dict["admin.media.saving"] || "" : isSaved ? dict["admin.media.saved"] || "" : ""}
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-medium text-[#b32d2e] hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{dict["admin.media.delete_permanently"] || ""}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
