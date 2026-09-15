import { Theme } from "@/lib/themes/types";
import { ThemeCard } from "./theme-card";

export function ThemeGrid({ themes }: { themes: Theme[] }) {
  if (!themes.length) {
    return (
      <div className="rounded border border-[#c3c4c7] bg-white p-8 text-center text-[13px] text-[#646970]">
        No themes found matching your criteria.
      </div>
    );
  }

  // Sort so active theme always appears first
  const sorted = [...themes].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((theme) => (
        <ThemeCard key={theme.slug} theme={theme} />
      ))}
    </div>
  );
}
