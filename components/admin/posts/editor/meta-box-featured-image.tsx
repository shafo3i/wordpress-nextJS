"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MetaBoxFeaturedImage({
  featuredImageId,
  onChange,
}: {
  featuredImageId: string;
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(!featuredImageId);

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Featured Image</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-xs text-[#50575e]">
          {featuredImageId && !isEditing ? (
            <div className="space-y-2">
              <div className="flex h-32 w-full items-center justify-center rounded border border-[#dcdcde] bg-[#f6f7f7] text-center">
                <span className="text-xs text-[#646970]">
                  Image ID #{featuredImageId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="text-xs text-[#2271b1] underline hover:text-[#135e96]"
                  onClick={() => setIsEditing(true)}
                  type="button"
                >
                  Change image
                </button>
                <button
                  className="text-xs text-[#b32d2e] underline hover:text-[#8c1617]"
                  onClick={() => onChange("")}
                  type="button"
                >
                  Remove featured image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                className="h-[28px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
                onChange={(e) => onChange(e.target.value)}
                placeholder="Attachment ID or Image URL"
                type="text"
                value={featuredImageId}
              />
              <p className="text-[11px] text-[#646970]">
                Enter media ID or image URL for featured image.
              </p>
              {featuredImageId && (
                <button
                  className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2 py-0.5 text-xs text-[#2271b1]"
                  onClick={() => setIsEditing(false)}
                  type="button"
                >
                  Save
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
