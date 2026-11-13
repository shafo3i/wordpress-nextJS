"use client";
export function ThemeUploadZone({
  isOpen,
  dict,
  direction = "ltr",
}: {
  isOpen: boolean;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  if (!isOpen) return null;
  return (
    <div
      dir={direction}
      className="rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-6 text-start"
    >
      <p className="text-[13px] text-[#50575e]">
        {dict?.["admin.themes.upload_unavailable"]}
      </p>
    </div>
  );
}
