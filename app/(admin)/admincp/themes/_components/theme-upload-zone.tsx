"use client";

import { useState } from "react";

interface ThemeUploadZoneProps {
  isOpen: boolean;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ThemeUploadZone({
  isOpen,
  dict,
  direction = "ltr",
}: ThemeUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    // Simulate upload delay for realistic WordPress behavior
    setTimeout(() => {
      setIsUploading(false);
      setMessage(
        dict?.["admin.themes.upload_success"] ||
          `Theme "${selectedFile.name.replace(/\.zip$/i, "")}" uploaded successfully.`
      );
      setSelectedFile(null);
    }, 1200);
  };

  return (
    <div
      dir={direction}
      className="rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-6 text-center text-start transition-all"
    >
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-[13px] text-[#50575e]">
          {dict?.["admin.themes.upload_help"] ||
            "If you have a theme in a .zip format, you may install or update it by uploading it here."}
        </p>

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="text-xs text-[#50575e] file:mr-2 file:rounded-[3px] file:border file:border-[#8c8f94] file:bg-white file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-[#2c3338] hover:file:bg-[#f0f0f1]"
          />
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1 text-xs font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-40 transition-colors"
          >
            {isUploading
              ? dict?.["admin.themes.installing"] || "Installing..."
              : dict?.["admin.themes.install_now"] || "Install Now"}
          </button>
        </form>

        {message && (
          <p className="text-xs text-[#008a20] font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
