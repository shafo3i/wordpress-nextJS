import { getAllThemes } from "@/lib/themes/loader";
import { Theme } from "@/lib/themes/types";

export async function getThemesQuery(search = ""): Promise<{
  themes: Theme[];
  activeTheme?: Theme;
}> {
  const allThemes = await getAllThemes();
  const q = search.trim().toLowerCase();

  const filtered = allThemes.filter((theme) => {
    if (!q) return true;
    const matchName = theme.name.toLowerCase().includes(q);
    const matchDesc = theme.description.toLowerCase().includes(q);
    const matchTags = theme.tags?.toLowerCase().includes(q);
    return matchName || matchDesc || matchTags;
  });

  // Sort active theme first
  const sorted = [...filtered].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    return 0;
  });

  const activeTheme = allThemes.find((t) => t.isActive);

  return {
    themes: sorted,
    activeTheme,
  };
}
