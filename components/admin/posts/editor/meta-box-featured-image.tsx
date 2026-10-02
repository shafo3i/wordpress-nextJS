"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, Trash2 } from "lucide-react";
import { MediaSelectModal } from "@/components/admin/media-select-modal";

export function MetaBoxFeaturedImage({
  featuredImageId,
  onChange,
  dict,
}: {
  featuredImageId: string;
  onChange: (id: string) => void;
  dict?: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isUrl = featuredImageId.startsWith("http://") || featuredImageId.startsWith("https://") || featuredImageId.startsWith("/");

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{dict?.["admin.editor.featured_image"] || "Featured Image"}</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-xs text-[#50575e]">
          {featuredImageId ? (
            <div className="space-y-2">
              <div className="relative aspect-video w-full overflow-hidden rounded border border-[#dcdcde] bg-[#f6f7f7] flex items-center justify-center">
                {isUrl ? (
                  <img
                    src={featuredImageId}
                    alt="Featured preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <ImageIcon className="size-8 text-[#2271b1] mb-1" />
                    <span className="text-xs text-[#1d2327] font-medium">
                      Attachment #{featuredImageId}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  className="text-xs text-[#2271b1] underline hover:text-[#135e96] cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                  type="button"
                >
                  {dict?.["admin.editor.change_image"] || "Change image"}
                </button>
                <button
                  className="text-xs text-[#b32d2e] underline hover:text-[#8c1617] cursor-pointer"
                  onClick={() => onChange("")}
                  type="button"
                >
                  {dict?.["admin.editor.remove_image"] || "Remove featured image"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 px-3 border-2 border-dashed border-[#c3c4c7] rounded hover:border-[#2271b1] hover:bg-[#f0f6fc] text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <ImageIcon className="size-6 text-[#2271b1]" />
                <span className="text-xs font-semibold text-[#2271b1]">
                  {dict?.["admin.editor.set_featured_image"] || "Set featured image"}
                </span>
                <span className="text-[11px] text-[#646970]">
                  Choose from media library or upload
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <MediaSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(item) => onChange(item.id.toString())}
        title={dict?.["admin.editor.set_featured_image"] || "Set featured image"}
        selectButtonText={dict?.["admin.editor.set_featured_image"] || "Set featured image"}
        dict={dict}
      />
    </div>
  );
}
