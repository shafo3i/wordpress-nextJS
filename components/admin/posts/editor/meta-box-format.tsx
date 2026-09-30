"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FORMATS = [
  { key: "standard", label: "Standard", dictKey: "admin.posts.format.standard" },
  { key: "aside", label: "Aside", dictKey: "admin.posts.format.aside" },
  { key: "image", label: "Image", dictKey: "admin.posts.format.image" },
  { key: "video", label: "Video", dictKey: "admin.posts.format.video" },
  { key: "quote", label: "Quote", dictKey: "admin.posts.format.quote" },
  { key: "link", label: "Link", dictKey: "admin.posts.format.link" },
  { key: "gallery", label: "Gallery", dictKey: "admin.posts.format.gallery" },
];

export function MetaBoxFormat({
  format = "standard",
  onChange,
  dict,
  direction = "ltr",
}: {
  format?: string;
  onChange?: (format: string) => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState(format);

  const handleSelect = (fmt: string) => {
    setSelectedFormat(fmt);
    onChange?.(fmt);
  };

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)] text-start" dir={direction}>
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{dict?.["admin.posts.format.title"] || "Format"}</span>
        <button className="text-[#50575e] hover:text-[#1d2327]" type="button">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-1.5 p-3 text-xs text-[#2c3338]">
          {FORMATS.map((fmt) => (
            <label
              className="flex items-center gap-2 py-0.5 hover:text-[#2271b1]"
              key={fmt.key}
            >
              <input
                checked={selectedFormat === fmt.key}
                className="text-[#2271b1] focus:ring-[#2271b1]"
                name="post_format"
                onChange={() => handleSelect(fmt.key)}
                type="radio"
                value={fmt.key}
              />
              <span>{dict?.[fmt.dictKey] || fmt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
