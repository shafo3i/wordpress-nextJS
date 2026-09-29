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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="size-3" />
        <span>{dict["admin.plugins.filter.active"] || "Active"}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
      <CircleOff className="size-3" />
      <span>{dict["admin.plugins.filter.inactive"] || "Inactive"}</span>
    </span>
  );
}
