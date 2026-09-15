"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FORMATS = [
  { key: "standard", label: "Standard" },
  { key: "aside", label: "Aside" },
  { key: "image", label: "Image" },
  { key: "video", label: "Video" },
  { key: "quote", label: "Quote" },
  { key: "link", label: "Link" },
  { key: "gallery", label: "Gallery" },
];

export function MetaBoxFormat({
  format = "standard",
  onChange,
}: {
  format?: string;
  onChange?: (format: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState(format);

  const handleSelect = (fmt: string) => {
    setSelectedFormat(fmt);
    onChange?.(fmt);
  };

  return (
    <div className="border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
      <div
        className="flex cursor-pointer select-none items-center justify-between border-b border-[#c3c4c7] px-3 py-2 text-[14px] font-semibold text-[#1d2327]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Format</span>
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
              <span>{fmt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
