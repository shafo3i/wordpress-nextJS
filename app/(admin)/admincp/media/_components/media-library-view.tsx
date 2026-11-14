"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  LayoutGrid,
  List as ListIcon,
  Search,
  Trash2,
  FileText,
  Music,
  Video,
  FileQuestion,
  Check,
  RefreshCw,
} from "lucide-react";
import type { MediaItem, MediaListResult } from "@/services/media.service";
import { AttachmentDetailsModal } from "./attachment-details-modal";
import {
  fetchMediaItemsAction,
  uploadMediaAction,
  deleteMediaAction,
} from "../actions";

interface MediaLibraryViewProps {
  initialData: MediaListResult;
  dict: Record<string, string>;
  direction: "rtl" | "ltr";
}

export function MediaLibraryView(props: MediaLibraryViewProps) {
  const searchParams = useSearchParams();
  const action = searchParams.get("action") || "";
  return <MediaLibraryPanel key={action} {...props} uploadInitiallyOpen={action === "upload"} />;
}
function MediaLibraryPanel({ initialData, dict, direction, uploadInitiallyOpen }: MediaLibraryViewProps & { uploadInitiallyOpen: boolean }) {
  const [data, setData] = useState<MediaListResult>(initialData);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploader, setShowUploader] = useState(uploadInitiallyOpen);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchVersion = useRef({ version: 0 });

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal & Selection state
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchItems = useCallback(
    async (page = 1, type = selectedType, month = selectedMonth, search = searchQuery) => {
      const version = ++fetchVersion.current.version;
      setError("");
      setIsLoading(true);
      try {
        const res = await fetchMediaItemsAction({
          page,
          type,
          month,
          search,
        });
        if (version !== fetchVersion.current.version) return;
        if (res.success && res.data) {
          setData(res.data);
          setCurrentPage(page);
        } else setError(res.error || dict["admin.media.error_failed"] || "");
      } catch {
        if (version === fetchVersion.current.version) setError(dict["admin.media.error_failed"] || "");
      } finally {
        if (version === fetchVersion.current.version) setIsLoading(false);
      }
    },
    [selectedType, selectedMonth, searchQuery, dict]
  );

  useEffect(() => {
    const requestState = fetchVersion.current;
    const timer = setTimeout(() => { void fetchItems(1, selectedType, selectedMonth, searchQuery); }, 0);
    return () => { clearTimeout(timer); requestState.version++; };
  }, [selectedType, selectedMonth, searchQuery, fetchItems]);

  async function handleFileUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(dict["admin.media.uploading"] || "");

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
      }

      const res = await uploadMediaAction(formData);

      if (res.success) {
        if (res.warning) alert(res.warning);
        setShowUploader(false);
        await fetchItems(1);
      } else {
        alert(res.error || "Failed to upload file");
      }
    } catch {
      alert(dict["admin.media.error_failed"] || "");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }

  function toggleSelectItem(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleDeleteBulk() {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      dict["admin.media.confirm_delete"] ||
        ""
    );
    if (!confirmed) return;

    try {
      const res = await deleteMediaAction(Array.from(selectedIds));
      if (res.success) {
        if (res.warning) alert(res.warning);
        setSelectedIds(new Set());
        setBulkMode(false);
        await fetchItems(currentPage);
      } else {
        alert(res.error || "Failed to delete items");
      }
    } catch {
      // ignore
    }
  }

  async function handleDeleteSingle(id: number) {
    try {
      const res = await deleteMediaAction([id]);
      if (res.success) {
        if (res.warning) alert(res.warning);
        setData((prev) => ({
          ...prev,
          items: prev.items.filter((item) => item.id !== id),
          total: Math.max(0, prev.total - 1),
        }));
        await fetchItems(currentPage);
        return true;
      }
      alert(res.error || dict["admin.media.error_failed"] || "");
    } catch {
      alert(dict["admin.media.error_failed"] || "");
    }
    return false;
  }

  function handleItemUpdated(updated: MediaItem) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === updated.id ? updated : it)),
    }));
  }

  return (
    <div className="space-y-4" dir={direction}>
      {error && <p role="alert" className="text-[#d63638]">{error}</p>}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c3c4c7] pb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1d2327]">
            {dict["admin.media.title"] || ""}
          </h1>
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="px-3 py-1 bg-white border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f6fc] text-xs font-semibold rounded transition-colors"
          >
            {dict["admin.media.add_new"] || ""}
          </button>
        </div>

        {/* View Switcher Icons */}
        <div className="flex items-center gap-1 border border-[#c3c4c7] rounded bg-white p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            title={dict["admin.media.grid_view"] || ""}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-[#2271b1] text-white"
                : "text-[#50575e] hover:bg-[#f0f0f1]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title={dict["admin.media.list_view"] || ""}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list"
                ? "bg-[#2271b1] text-white"
                : "text-[#50575e] hover:bg-[#f0f0f1]"
            }`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Drag-and-Drop Uploader */}
      {showUploader && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-white border-2 border-dashed border-[#c3c4c7] rounded p-8 text-center space-y-3 relative transition-all"
        >
          <Upload className="w-10 h-10 text-[#2271b1] mx-auto opacity-80" />
          <h3 className="text-base font-bold text-[#1d2327]">
            {dict["admin.media.dropzone_text"] || ""}
          </h3>
          <p className="text-xs text-[#646970]">
            {dict["admin.media.dropzone_subtext"] || ""}
          </p>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
          >
            {isUploading
              ? uploadProgress
              : dict["admin.media.upload_files"] || ""}
          </button>

          <p className="text-[11px] text-[#8c8f94] pt-2">
            {dict["admin.media.max_size"] || ""}
          </p>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white border border-[#c3c4c7] p-2.5 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Media Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 border border-[#8c8f94] rounded text-xs bg-white text-[#1d2327] outline-none focus:border-[#2271b1]"
          >
            <option value="all">{dict["admin.media.filter_all_types"] || ""}</option>
            <option value="image">{dict["admin.media.filter_images"] || ""}</option>
            <option value="document">{dict["admin.media.filter_documents"] || ""}</option>
            <option value="audio">{dict["admin.media.filter_audio"] || ""}</option>
            <option value="video">{dict["admin.media.filter_video"] || ""}</option>
          </select>

          {/* Date Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2.5 py-1.5 border border-[#8c8f94] rounded text-xs bg-white text-[#1d2327] outline-none focus:border-[#2271b1]"
          >
            <option value="all">{dict["admin.media.filter_all_dates"] || ""}</option>
            {data.availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Bulk Select Button */}
          {!bulkMode ? (
            <button
              onClick={() => setBulkMode(true)}
              className="px-3 py-1.5 bg-[#f6f7f7] border border-[#dcdcde] text-[#2271b1] hover:bg-[#f0f0f1] rounded font-medium transition-colors"
            >
              {dict["admin.media.bulk_select"] || ""}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBulkMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 bg-[#f6f7f7] border border-[#dcdcde] text-[#50575e] hover:bg-[#f0f0f1] rounded font-medium transition-colors"
              >
                {dict["admin.media.cancel_bulk"] || ""}
              </button>
              <button
                onClick={handleDeleteBulk}
                disabled={selectedIds.size === 0}
                className="px-3 py-1.5 bg-[#b32d2e] hover:bg-[#a02223] text-white rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {dict["admin.media.delete_selected"] || ""} (
                  {selectedIds.size})
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <input
              type="text"
              placeholder={dict["admin.media.search_placeholder"] || ""}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-[#8c8f94] rounded text-xs w-48 sm:w-64 focus:border-[#2271b1] outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#8c8f94] absolute left-2.5 top-2.5" />
          </div>
          {isLoading && <RefreshCw className="w-4 h-4 text-[#2271b1] animate-spin" />}
        </div>
      </div>

      {/* Media Grid View */}
      {viewMode === "grid" && (
        <div className="space-y-4">
          {data.items.length === 0 ? (
            <div className="bg-white border border-[#c3c4c7] p-12 text-center rounded text-xs text-[#646970]">
              <FileQuestion className="w-12 h-12 text-[#c3c4c7] mx-auto mb-2" />
              <p className="font-semibold">{dict["admin.media.no_media"] || ""}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {data.items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isImage = item.mimeType.startsWith("image/");
                const isVideo = item.mimeType.startsWith("video/");
                const isAudio = item.mimeType.startsWith("audio/");

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (bulkMode) {
                        toggleSelectItem(item.id);
                      } else {
                        setActiveItem(item);
                      }
                    }}
                    className={`group aspect-square relative bg-[#f6f7f7] border rounded overflow-hidden cursor-pointer shadow-xs transition-all ${
                      isSelected
                        ? "border-[#2271b1] ring-2 ring-[#2271b1]"
                        : "border-[#dcdcde] hover:border-[#2271b1]"
                    }`}
                  >
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-[#646970]">
                        {isVideo ? (
                          <Video className="w-8 h-8 mb-1 text-[#2271b1]" />
                        ) : isAudio ? (
                          <Music className="w-8 h-8 mb-1 text-[#2271b1]" />
                        ) : (
                          <FileText className="w-8 h-8 mb-1 text-[#2271b1]" />
                        )}
                        <span className="text-[10px] text-center font-medium line-clamp-2 px-1">
                          {item.filename}
                        </span>
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    {bulkMode && (
                      <div
                        className={`absolute top-1.5 left-1.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#2271b1] border-[#2271b1] text-white"
                            : "bg-white/90 border-[#8c8f94]"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    )}

                    {/* Title Overlay on Hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Media List View */}
      {viewMode === "list" && (
        <div className="bg-white border border-[#c3c4c7] rounded overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[#1d2327]">
                <th className="p-3 w-10 text-center">
                  <span className="sr-only">{dict["admin.common.select"] || ""}</span>
                </th>
                <th className="p-3 font-semibold">{dict["admin.media.file_name"] || ""}</th>
                <th className="p-3 font-semibold">{dict["admin.media.uploaded_by"] || ""}</th>
                <th className="p-3 font-semibold">{dict["admin.media.uploaded_on"] || ""}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[#646970]">
                    {dict["admin.media.no_media"] || ""}
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#f6f7f7] transition-colors ${
                      selectedIds.has(item.id) ? "bg-[#f0f6fc]" : ""
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="h-4 w-4 text-[#2271b1] rounded border-[#8c8f94] focus:ring-[#2271b1]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setActiveItem(item)}
                          className="w-12 h-12 rounded bg-[#f0f0f1] border border-[#dcdcde] overflow-hidden shrink-0 cursor-pointer flex items-center justify-center"
                        >
                          {item.mimeType.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnailUrl || item.url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-[#646970]" />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => setActiveItem(item)}
                            className="font-semibold text-[#2271b1] hover:underline text-left block"
                          >
                            {item.title}
                          </button>
                          <span className="font-mono text-[10px] text-[#646970]">
                            {item.filename}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-[11px]">
                            <button
                              onClick={() => setActiveItem(item)}
                              className="text-[#2271b1] hover:underline"
                            >
                              Edit
                            </button>
                            <span className="text-[#c3c4c7]">|</span>
                            <button
                              onClick={() => handleDeleteSingle(item.id)}
                              className="text-[#b32d2e] hover:underline"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#646970]">{item.authorName}</td>
                    <td className="p-3 text-[#646970]">
                      {new Date(item.uploadedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#646970] pt-2">
          <span>
            {dict["admin.pagination.showing"] || ""}{" "}
            {Math.min(data.total, (currentPage - 1) * 40 + 1)} -{" "}
            {Math.min(data.total, currentPage * 40)} {dict["admin.pagination.of"] || ""}{" "}
            {data.total} {dict["admin.pagination.items"] || ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchItems(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-2.5 py-1 border border-[#c3c4c7] rounded bg-white hover:bg-[#f6f7f7] disabled:opacity-50"
            >
              {dict["admin.pagination.prev"] || ""}
            </button>
            <span className="px-2">
              {currentPage} / {data.totalPages}
            </span>
            <button
              onClick={() => fetchItems(currentPage + 1)}
              disabled={currentPage >= data.totalPages || isLoading}
              className="px-2.5 py-1 border border-[#c3c4c7] rounded bg-white hover:bg-[#f6f7f7] disabled:opacity-50"
            >
              {dict["admin.pagination.next"] || ""}
            </button>
          </div>
        </div>
      )}

      {/* Attachment Details Slide-over / Modal */}
      <AttachmentDetailsModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onUpdate={handleItemUpdated}
        onDelete={handleDeleteSingle}
        dict={dict}
        direction={direction}
      />
    </div>
  );
}
