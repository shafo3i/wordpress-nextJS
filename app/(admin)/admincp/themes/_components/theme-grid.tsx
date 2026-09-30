"use client";

import { useState } from "react";
import { Theme } from "@/lib/themes/types";
import { ThemeCard } from "./theme-card";
import { ThemeDetailsModal } from "./theme-details-modal";

interface ThemeGridProps {
  themes: Theme[];
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export function ThemeGrid({ themes, dict, direction = "ltr" }: ThemeGridProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  if (!themes.length) {
    return (
      <div className="rounded border border-[#c3c4c7] bg-white p-8 text-center text-[13px] text-[#646970]">
        {dict?.["admin.themes.no_themes"] || "No themes found matching your criteria."}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.slug}
            theme={theme}
            onOpenDetails={setSelectedTheme}
            dict={dict}
          />
        ))}
      </div>

      <ThemeDetailsModal
        theme={selectedTheme}
        allThemes={themes}
        onClose={() => setSelectedTheme(null)}
        onSelectTheme={setSelectedTheme}
        dict={dict}
        direction={direction}
      />
    </>
  );
}
