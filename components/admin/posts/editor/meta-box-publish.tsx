"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MetaBoxPublish({
  status,
  onStatusChange,
  isPostTypePage = false,
  isExisting = false,
  onTrash,
  isSaving = false,
  dict,
  previewUrl,
}: {
  status: string;
  onStatusChange: (status: string) => void;
  isPostTypePage?: boolean;
  isExisting?: boolean;
  onTrash?: () => void;
  isSaving?: boolean;
  dict?: Record<string, string>;
  previewUrl?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [isEditingVisibility, setIsEditingVisibility] = useState(false);
  const [visibility, setVisibility] = useState("public");

  const statusLabel =
    status === "publish"
      ? (dict?.["admin.editor.status_published"] || "Published")
      : status === "pending"
        ? (dict?.["admin.editor.status_pending"] || "Pending Review")
        : status === "private"
          ? (dict?.["admin.editor.status_private"] || "Private")
          : (dict?.["admin.editor.status_draft"] || "Draft");

  const handleSaveStatus = () => {
    onStatusChange(tempStatus);
    setIsEditingStatus(false);
  };

  const publishSubmitValue = isExisting && status !== "draft" ? status : "publish";

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{dict?.["admin.editor.publish"] || "Publish"}</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-xs text-[#50575e]">
          {/* Top Actions: Save Draft & Preview */}
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#f0f0f1] pb-3">
            <button
              className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              name="status"
              onClick={() => onStatusChange("draft")}
              type="submit"
              value="draft"
            >
              {dict?.["admin.editor.save_draft"] || "Save Draft"}
            </button>
            <button
              className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={() => {
                if (previewUrl) {
                  window.open(previewUrl, "_blank");
                }
              }}
              type="button"
            >
              {dict?.["admin.editor.preview"] || "Preview"}
            </button>
          </div>

          {/* Status, Visibility, Schedule rows */}
          <div className="space-y-2 pb-3">
            {/* Status */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base text-[#50575e]">📍</span>
                <span>
                  {dict?.["admin.editor.status"] || "Status:"} <strong>{statusLabel}</strong>
                </span>
                {!isEditingStatus && (
                  <button
                    className="mx-1 text-[#2271b1] underline hover:text-[#135e96]"
                    onClick={() => {
                      setTempStatus(status);
                      setIsEditingStatus(true);
                    }}
                    type="button"
                  >
                    {dict?.["common.edit"] || "Edit"}
                  </button>
                )}
              </div>

              {isEditingStatus && (
                <div className="mt-2 rounded border border-[#dcdcde] bg-[#f6f7f7] p-2">
                  <select
                    className="mb-2 h-[28px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338]"
                    onChange={(e) => setTempStatus(e.target.value)}
                    value={tempStatus}
                  >
                    <option value="draft">{dict?.["admin.editor.status_draft"] || "Draft"}</option>
                    <option value="pending">{dict?.["admin.editor.status_pending"] || "Pending Review"}</option>
                    <option value="publish">{dict?.["admin.editor.status_published"] || "Published"}</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2 py-0.5 text-xs text-[#2271b1] hover:bg-[#f0f0f1]"
                      onClick={handleSaveStatus}
                      type="button"
                    >
                      {dict?.["admin.common.confirm"] || "OK"}
                    </button>
                    <button
                      className="text-xs text-[#2271b1] underline"
                      onClick={() => setIsEditingStatus(false)}
                      type="button"
                    >
                      {dict?.["common.cancel"] || "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base text-[#50575e]">👁</span>
                <span>
                  {dict?.["admin.editor.visibility"] || "Visibility:"}{" "}
                  <strong>
                    {visibility === "public"
                      ? (dict?.["admin.editor.visibility_public"] || "Public")
                      : (dict?.["admin.editor.visibility_private"] || "Private")}
                  </strong>
                </span>
                {!isEditingVisibility && (
                  <button
                    className="mx-1 text-[#2271b1] underline hover:text-[#135e96]"
                    onClick={() => setIsEditingVisibility(true)}
                    type="button"
                  >
                    {dict?.["common.edit"] || "Edit"}
                  </button>
                )}
              </div>

              {isEditingVisibility && (
                <div className="mt-2 rounded border border-[#dcdcde] bg-[#f6f7f7] p-2 space-y-1">
                  <label className="flex items-center gap-1.5">
                    <input
                      checked={visibility === "public"}
                      name="visibility_radio"
                      onChange={() => setVisibility("public")}
                      type="radio"
                    />
                    <span>{dict?.["admin.editor.visibility_public"] || "Public"}</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      checked={visibility === "private"}
                      name="visibility_radio"
                      onChange={() => setVisibility("private")}
                      type="radio"
                    />
                    <span>{dict?.["admin.editor.visibility_private"] || "Private"}</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2 py-0.5 text-xs text-[#2271b1] hover:bg-[#f0f0f1]"
                      onClick={() => setIsEditingVisibility(false)}
                      type="button"
                    >
                      {dict?.["admin.common.confirm"] || "OK"}
                    </button>
                    <button
                      className="text-xs text-[#2271b1] underline"
                      onClick={() => setIsEditingVisibility(false)}
                      type="button"
                    >
                      {dict?.["common.cancel"] || "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Publish Immediately */}
            <div className="flex items-center gap-1.5">
              <span className="text-base text-[#50575e]">🗓</span>
              <span>
                {dict?.["admin.editor.publish_immediately"] || "Publish immediately"}
              </span>
            </div>
          </div>

          {/* Bottom Actions: Move to Trash & Publish Button */}
          <div className="flex items-center justify-between border-t border-[#f0f0f1] pt-3">
            {onTrash ? (
              <button
                className="text-xs text-[#b32d2e] underline hover:text-[#8c1617]"
                onClick={onTrash}
                type="button"
              >
                {dict?.["admin.editor.move_to_trash"] || "Move to Trash"}
              </button>
            ) : (
              <span />
            )}

            <button
              className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50"
              disabled={isSaving}
              name="status"
              onClick={() => {
                if (!isExisting || status === "draft") {
                  onStatusChange("publish");
                }
              }}
              type="submit"
              value={publishSubmitValue}
            >
              {isSaving
                ? isExisting
                  ? (dict?.["admin.editor.updating"] || "Updating...")
                  : (dict?.["admin.editor.publishing"] || "Publishing...")
                : isExisting
                  ? (dict?.["admin.editor.update"] || "Update")
                  : (dict?.["admin.editor.publish"] || "Publish")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
