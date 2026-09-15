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
}: {
  status: string;
  onStatusChange: (status: string) => void;
  isPostTypePage?: boolean;
  isExisting?: boolean;
  onTrash?: () => void;
  isSaving?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [isEditingVisibility, setIsEditingVisibility] = useState(false);
  const [visibility, setVisibility] = useState("public");

  const statusLabel =
    status === "publish"
      ? "Published"
      : status === "pending"
        ? "Pending Review"
        : status === "private"
          ? "Private"
          : "Draft";

  const handleSaveStatus = () => {
    onStatusChange(tempStatus);
    setIsEditingStatus(false);
  };

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Publish</span>
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
              type="submit"
              value="draft"
            >
              Save Draft
            </button>
            <button
              className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={() => alert("Preview mode opens your post on the front-end.")}
              type="button"
            >
              Preview
            </button>
          </div>

          {/* Status, Visibility, Schedule rows */}
          <div className="space-y-2 pb-3">
            {/* Status */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base text-[#50575e]">📍</span>
                <span>
                  Status: <strong>{statusLabel}</strong>
                </span>
                {!isEditingStatus && (
                  <button
                    className="ml-1 text-[#2271b1] underline hover:text-[#135e96]"
                    onClick={() => {
                      setTempStatus(status);
                      setIsEditingStatus(true);
                    }}
                    type="button"
                  >
                    Edit
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
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Review</option>
                    <option value="publish">Published</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2 py-0.5 text-xs text-[#2271b1] hover:bg-[#f0f0f1]"
                      onClick={handleSaveStatus}
                      type="button"
                    >
                      OK
                    </button>
                    <button
                      className="text-xs text-[#2271b1] underline"
                      onClick={() => setIsEditingStatus(false)}
                      type="button"
                    >
                      Cancel
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
                  Visibility: <strong>{visibility === "public" ? "Public" : "Private"}</strong>
                </span>
                {!isEditingVisibility && (
                  <button
                    className="ml-1 text-[#2271b1] underline hover:text-[#135e96]"
                    onClick={() => setIsEditingVisibility(true)}
                    type="button"
                  >
                    Edit
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
                    <span>Public</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      checked={visibility === "private"}
                      name="visibility_radio"
                      onChange={() => setVisibility("private")}
                      type="radio"
                    />
                    <span>Private</span>
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2 py-0.5 text-xs text-[#2271b1] hover:bg-[#f0f0f1]"
                      onClick={() => setIsEditingVisibility(false)}
                      type="button"
                    >
                      OK
                    </button>
                    <button
                      className="text-xs text-[#2271b1] underline"
                      onClick={() => setIsEditingVisibility(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Publish Immediately */}
            <div className="flex items-center gap-1.5">
              <span className="text-base text-[#50575e]">🗓</span>
              <span>
                Publish <strong>immediately</strong>
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
                Move to Trash
              </button>
            ) : (
              <span />
            )}

            <button
              className="inline-flex items-center rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white shadow-[0_1px_0_#135e96] hover:border-[#135e96] hover:bg-[#135e96] disabled:opacity-50"
              disabled={isSaving}
              name="status"
              type="submit"
              value="publish"
            >
              {isSaving
                ? isExisting
                  ? "Updating..."
                  : "Publishing..."
                : isExisting
                  ? "Update"
                  : "Publish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
