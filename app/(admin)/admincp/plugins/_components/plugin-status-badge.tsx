import { CheckCircle2, CircleOff } from "lucide-react";

export function PluginStatusBadge({
  isActive,
  dict = {},
}: {
  isActive?: boolean;
  dict?: Record<string, string>;
}) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f6e8] px-2 py-0.5 text-[11px] font-semibold text-[#00a32a] border border-[#00a32a]/30">
        <CheckCircle2 className="size-3 text-[#00a32a]" />
        <span>{dict["admin.plugins.filter.active"] || "Active"}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f0f1] px-2 py-0.5 text-[11px] font-medium text-[#50575e] border border-[#c3c4c7]">
      <CircleOff className="size-3 text-[#50575e]" />
      <span>{dict["admin.plugins.filter.inactive"] || "Inactive"}</span>
    </span>
  );
}
