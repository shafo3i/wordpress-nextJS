"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Upload,
  Search,
  Check,
  Loader2,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
} from "lucide-react";
import type { MediaItem, MediaListResult } from "@/services/media.service";
import { fetchMediaItemsAction, uploadMediaAction } from "@/app/(admin)/admincp/media/actions";

interface MediaSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
  selectButtonText?: string;
  dict?: Record<string, string>;
}

export function MediaSelectModal({
  isOpen,
  onClose,
  onSelect,
  title,
  selectButtonText,
  dict = {},
}: MediaSelectModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "library">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media library items
  const loadMedia = useCallback(async (query: string = "") => {
    setIsLoading(true);
    try {
      const res = await fetchMediaItemsAction({
        search: query,
        page: 1,
        perPage: 40,
        type: "image",
      });
      if (res.success && res.data) {
        setItems(res.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMedia(searchQuery);
    }
  }, [isOpen, loadMedia, searchQuery]);

  // Handle file drop or selection
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }

      const res = await uploadMediaAction(formData);
      if (res.success && res.items && res.items.length > 0) {
        const first = res.items[0];
        setSelectedItem(first);
        setActiveTab("library");
        loadMedia();
      } else {
        setUploadError(res.error || "Failed to upload file.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 md:p-10 backdrop-blur-xs">
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col rounded-[3px] border border-[#c3c4c7] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#c3c4c7] px-4 py-3 bg-[#f6f7f7]">
          <h2 className="text-[16px] font-semibold text-[#1d2327]">
            {title || dict["admin.media.library"] || "Select Media"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#646970] hover:text-[#1d2327] transition-colors p-1 rounded"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[#dcdcde] bg-[#f0f0f1] px-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === "upload"
                  ? "border-[#2271b1] text-[#2271b1] bg-white"
                  : "border-transparent text-[#50575e] hover:text-[#1d2327]"
              }`}
            >
              {dict["admin.menu.add_new_media"] || "Upload files"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-[1px] transition-colors cursor-pointer ${
                activeTab === "library"
                  ? "border-[#2271b1] text-[#2271b1] bg-white"
                  : "border-transparent text-[#50575e] hover:text-[#1d2327]"
              }`}
            >
              {dict["admin.menu.library"] || "Media Library"}
            </button>
          </div>

          {activeTab === "library" && (
            <div className="relative my-1.5 w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict["admin.media.search_placeholder"] || "Search media..."}
                className="h-[28px] w-full rounded-[3px] border border-[#8c8f94] bg-white ps-7 pe-2 text-[12px] text-[#2c3338] focus:border-[#2271b1] focus:outline-hidden"
              />
              <Search className="absolute start-2 top-2 size-3.5 text-[#646970]" />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Tab: Upload */}
          {activeTab === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                className="w-full max-w-lg border-2 border-dashed border-[#c3c4c7] rounded-lg p-10 flex flex-col items-center justify-center space-y-4 hover:border-[#2271b1] transition-colors"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-[#f0f6fc] text-[#2271b1]">
                  <Upload className="size-7" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1d2327]">
                    Drop files anywhere to upload
                  </h3>
                  <p className="text-[12px] text-[#646970] mt-1">
                    or select files from your computer
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-white px-4 py-1.5 text-[13px] font-medium text-[#2271b1] hover:bg-[#f0f6fc] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{dict["admin.media.uploading"] || "Uploading..."}</span>
                    </>
                  ) : (
                    <span>Select Files</span>
                  )}
                </button>
                {uploadError && (
                  <p className="text-[12px] text-[#d63638]">{uploadError}</p>
                )}
                <p className="text-[11px] text-[#8c8f94]">
                  Maximum upload file size: 32 MB. Supported: JPG, PNG, WEBP, GIF, SVG.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Media Library */}
          {activeTab === "library" && (
            <div className="flex-1 flex overflow-hidden">
              {/* Media Grid */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#f0f0f1]">
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-[#2271b1]" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-center">
                    <ImageIcon className="size-12 text-[#c3c4c7] mb-2" />
                    <p className="text-[13px] text-[#646970]">
                      {dict["admin.media.no_media"] || "No media files found."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {items.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className={`group relative aspect-square overflow-hidden rounded-[2px] bg-white border-2 transition-all cursor-pointer text-start ${
                            isSelected
                              ? "border-[#2271b1] ring-2 ring-[#2271b1]/30 shadow-md"
                              : "border-[#dcdcde] hover:border-[#8c8f94]"
                          }`}
                        >
                          {item.mimeType?.startsWith("image/") ? (
                            <img
                              src={item.thumbnailUrl || item.url}
                              alt={item.altText || item.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-[#f6f7f7] p-2 text-center">
                              {item.mimeType?.startsWith("audio/") && <Music className="size-8 text-[#646970]" />}
                              {item.mimeType?.startsWith("video/") && <Video className="size-8 text-[#646970]" />}
                              {!item.mimeType?.startsWith("audio/") && !item.mimeType?.startsWith("video/") && (
                                <FileText className="size-8 text-[#646970]" />
                              )}
                              <span className="mt-1 text-[10px] text-[#50575e] truncate w-full">
                                {item.filename}
                              </span>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute top-1 end-1 flex size-5 items-center justify-center rounded-full bg-[#2271b1] text-white shadow-sm">
                              <Check className="size-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Item Sidebar */}
              <div className="w-72 border-s border-[#c3c4c7] bg-[#f6f7f7] p-4 overflow-y-auto flex flex-col justify-between shrink-0">
                {selectedItem ? (
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-semibold text-[#1d2327] uppercase tracking-wide border-b border-[#dcdcde] pb-2">
                      {dict["admin.media.details_title"] || "Attachment Details"}
                    </h3>

                    <div className="aspect-video w-full rounded border border-[#dcdcde] overflow-hidden bg-white">
                      <img
                        src={selectedItem.url}
                        alt={selectedItem.altText || selectedItem.title}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="space-y-1.5 text-[12px] text-[#50575e]">
                      <p className="font-semibold text-[#1d2327] truncate" title={selectedItem.filename}>
                        {selectedItem.filename}
                      </p>
                      <p>{selectedItem.uploadedAt}</p>
                      <p>{(selectedItem.sizeBytes / 1024).toFixed(1)} KB</p>
                      {selectedItem.width && selectedItem.height && (
                        <p>{selectedItem.width} by {selectedItem.height} pixels</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center p-4">
                    <p className="text-[12px] text-[#646970]">
                      Click an image to inspect details and choose it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#c3c4c7] bg-[#f6f7f7] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] border border-[#c3c4c7] bg-white px-3 py-1.5 text-[13px] font-medium text-[#2c3338] hover:bg-[#f0f0f1] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedItem}
            onClick={() => {
              if (selectedItem) {
                onSelect(selectedItem);
                onClose();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#135e96] transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{selectButtonText || "Select"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
