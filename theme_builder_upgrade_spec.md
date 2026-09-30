# Theme Page Builder Upgrade Specification: Hierarchical Sections, Columns & Blocks

## 1. Overview & Vision

Currently, the Theme Settings homepage layout operates on a flat array of `HomepageBlock[]`, which forces every block to stack vertically. Furthermore, complex editorial layouts (such as the Broadsheet block shown below) attempt to simulate columns internally with hardcoded sub-headers (`COLUMN I • REGIONAL`, `COLUMN II • CENTER LEAD FEATURE`, `COLUMN III • NEWS WIRE`):

```
Current Rigid Model:
[ Page Layout ] ──► Flat Vertical Stack of Blocks:
                    ├── [ Magazine Bento Block ]
                    ├── [ Broadsheet 3-Col Block (hardcoded internal columns) ]
                    └── [ News List Block ]
```

### The Goal
Upgrade the theme customization engine to a **hierarchical visual layout builder** (analogous to Elementor / Gutenberg / WordPress Site Editor):
1. **Sections**: Define full-width or boxed containers with customizable backgrounds, padding, and section titles.
2. **Rows & Columns**: Define responsive grid ratios (`1/1`, `1/2 + 1/2`, `2/3 + 1/3`, `1/3 + 1/3 + 1/3`, etc.).
3. **Items**: Can be **any existing Editorial Block** (preserved 100% without modification or deletion) **OR any Widget from the new modular widget registry** (Weather, Audio Stream, Newsletter, Search, etc.).

```
Target Hierarchical Model:
[ Homepage ]
  ├── Section 1: Hero Showcase (Boxed, Padding Medium)
  │     └── Row 1: [ 1/1 Full Width ]
  │           └── Column 1:
  │                 └── [ Magazine Bento Block ]
  │
  ├── Section 2: News Desk Hub (Muted Background, Boxed)
  │     └── Row 1: [ 2/3 Main Column  |  1/3 Sidebar Column ]
  │           ├── Column 1 (2/3):
  │           │     ├── [ Visual Category Grid Block ]
  │           │     └── [ Chronological News List Block ]
  │           │
  │           └── Column 2 (1/3):
  │                 ├── [ Trending Leaderboard Block ]
  │                 ├── [ Weather Widget ]
  │                 └── [ Newsletter Signup Widget ]
  │
  └── Section 3: Full-Bleed Media (Dark Background, Full-Width)
        └── Row 1: [ 1/2  |  1/2 ]
              ├── Column 1: [ Daily Podcast & Audio Player Widget ]
              └── Column 2: [ Opinion & Commentary Block ]
```

---

## 2. Core Principles & Constraints

1. **Zero Deletion / Zero Breaking Changes**:
   - Every single existing block (`magazine_bento`, `broadsheet_3col`, `hero_slider`, `big_lead_side_list`, `news_list`, `visual_grid`, `tabbed_block`, `trending`, `opinion`, `newsletter`, `multimedia`) is preserved exactly as is.
2. **First-Class Widget Integration**:
   - Any widget registered in `widgets/registry.ts` can be embedded into any layout column alongside editorial blocks.
3. **Full Backward Compatibility**:
   - An adapter will detect if stored settings are in the legacy flat `blocks: HomepageBlock[]` format and dynamically adapt them to the new Section/Column format at runtime without data loss.
4. **Mobile First Responsive Collapse**:
   - Multi-column layouts automatically stack gracefully on tablets and mobile screens (`grid-cols-1 md:grid-cols-12`).

---

## 3. Data Architecture ([lib/themes/homepage-types.ts](file:///e:/DevOps/wp-clone/news/lib/themes/homepage-types.ts))

```typescript
import type { WidgetItem } from "@/widgets/types";

// Column Width Presets
export type ColumnWidth = 
  | "1/1"  // 12 of 12 columns (100%)
  | "1/2"  // 6 of 12 columns (50%)
  | "1/3"  // 4 of 12 columns (33.33%)
  | "2/3"  // 8 of 12 columns (66.66%)
  | "1/4"  // 3 of 12 columns (25%)
  | "3/4"; // 9 of 12 columns (75%)

// Universal Layout Item: either an Editorial Block OR a Widget
export type BuilderItemType = "block" | "widget";

export interface BuilderItem {
  id: string;
  itemType: BuilderItemType;
  // If itemType === "block":
  blockConfig?: HomepageBlock;
  // If itemType === "widget":
  widgetConfig?: WidgetItem;
}

// Column Definition
export interface PageBuilderColumn {
  id: string;
  width: ColumnWidth;
  items: BuilderItem[];
}

// Row Definition
export interface PageBuilderRow {
  id: string;
  columns: PageBuilderColumn[];
  gap?: "none" | "small" | "medium" | "large";
}

// Section Definition
export interface PageBuilderSection {
  id: string;
  title?: string;
  enabled: boolean;
  container: "boxed" | "full_width";
  background?: "default" | "muted" | "card" | "dark" | "accent";
  paddingY?: "none" | "small" | "medium" | "large";
  rows: PageBuilderRow[];
}

// Master Homepage Settings Contract
export interface HomepageSettings {
  layout: HomepageLayout;           // Legacy sidebar layout frame (full_width, right_sidebar, etc.)
  sections: PageBuilderSection[];   // Hierarchical section tree
  blocks?: HomepageBlock[];         // Optional legacy fallback for seamless migration
}
```

---

## 4. Column Presets & Grid Translation

| Preset Name | Grid Ratio | Column 1 Width | Column 2 Width | Column 3 Width | Tailwind Classes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Full Width** | `1/1` | `col-span-12` | — | — | `col-span-12` |
| **Half & Half** | `1/2 + 1/2` | `md:col-span-6` | `md:col-span-6` | — | `col-span-12 md:col-span-6` |
| **Main + Sidebar** | `2/3 + 1/3` | `md:col-span-8` | `md:col-span-4` | — | `col-span-12 md:col-span-8` / `md:col-span-4` |
| **Sidebar + Main** | `1/3 + 2/3` | `md:col-span-4` | `md:col-span-8` | — | `col-span-12 md:col-span-4` / `md:col-span-8` |
| **Three Equal** | `1/3 + 1/3 + 1/3`| `md:col-span-4` | `md:col-span-4` | `md:col-span-4` | `col-span-12 md:col-span-4` |
| **Lead Center** | `1/4 + 1/2 + 1/4`| `md:col-span-3` | `md:col-span-6` | `md:col-span-3` | `col-span-12 md:col-span-3` / `md:col-span-6` |

---

## 5. Admin Theme Settings Builder UX

The builder UI in [theme-settings-shell.tsx](file:///e:/DevOps/wp-clone/news/app/(admin)/admincp/theme-settings/_components/theme-settings-shell.tsx) will provide:

### 1. Section Level Controls
- **`+ Add Section`** button.
- Section Toolbar: Reorder Up/Down, Container toggle (*Boxed* vs *Full Width*), Background selector (*Default*, *Muted*, *Dark*, *Accent*), Delete section.
- Section Header option: Optional title (e.g. "Global Markets & Business") with section title divider style.

### 2. Row Level Controls
- Row Column Presets selector: Visual icons showing `1/1`, `1/2 | 1/2`, `2/3 | 1/3`, `1/3 | 1/3 | 1/3`, etc.
- Clicking a preset configures the row's columns automatically.

### 3. Column Drop Zones & Item Inserter
- Inside each column:
  - An **`+ Add Content`** button opening a modal with 2 tabs:
    - **Tab 1: Editorial Blocks**: Bento, Slider, News List, Trending, Opinion, Visual Grid, etc.
    - **Tab 2: Widgets**: Weather Desk, Audio Podcast, Newsletter, Search Bar, Categories, Author Bio, Sponsor Ad, etc.
  - Placed items show an accordion card with title, type badge, gear icon to open configuration, and delete button.
  - Items can be reordered up/down within the column.

---

## 6. Frontend Rendering Engine ([components/site/templates/news-home.tsx](file:///e:/DevOps/wp-clone/news/components/site/templates/news-home.tsx))

A dedicated `BuilderSectionRenderer` component will cleanly map the hierarchy:

```tsx
export function BuilderSectionRenderer({ section, posts, theme }: SectionRendererProps) {
  if (!section.enabled) return null;

  const bgClasses = {
    default: "bg-transparent",
    muted: "bg-slate-50 dark:bg-slate-900/50",
    card: "bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800",
    dark: "bg-slate-950 text-white",
    accent: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40",
  }[section.background || "default"];

  const containerClasses = section.container === "full_width" ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <section className={`py-6 ${bgClasses}`}>
      <div className={containerClasses}>
        {section.title && <ThemeSectionHeader title={section.title} theme={theme} />}
        
        <div className="space-y-6">
          {section.rows.map((row) => (
            <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {row.columns.map((col) => (
                <div key={col.id} className={getColumnSpanClass(col.width)}>
                  <div className="space-y-6">
                    {col.items.map((item) => (
                      <BuilderItemRenderer key={item.id} item={item} posts={posts} theme={theme} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 7. Backward-Compatibility Migration Strategy

```typescript
export function normalizeHomepageSettings(raw: any, themeSlug: string): HomepageSettings {
  // If already in new hierarchical format:
  if (Array.isArray(raw?.sections) && raw.sections.length > 0) {
    return raw as HomepageSettings;
  }

  // Legacy format: wrap flat blocks into standard sections
  const legacyBlocks = Array.isArray(raw?.blocks) ? raw.blocks : getThemeDefaultSettings(themeSlug).blocks;

  const migratedSections: PageBuilderSection[] = legacyBlocks.map((block: HomepageBlock, idx: number) => ({
    id: `migrated-sec-${block.id || idx}`,
    enabled: block.enabled !== false,
    container: "boxed",
    background: "default",
    paddingY: "medium",
    rows: [
      {
        id: `migrated-row-${idx}`,
        columns: [
          {
            id: `migrated-col-${idx}`,
            width: "1/1",
            items: [
              {
                id: `item-${block.id}`,
                itemType: "block",
                blockConfig: block,
              },
            ],
          },
        ],
      },
    ],
  }));

  return {
    layout: raw?.layout || "full_width",
    sections: migratedSections,
  };
}
```

---

## 8. Implementation Steps

1. **Step 1**: Update `lib/themes/homepage-types.ts` with the new hierarchical types and helper functions (`normalizeHomepageSettings`, column width calculators).
2. **Step 2**: Create `components/site/builder/` containing:
   - `builder-item-renderer.tsx` (renders either an editorial block or a widget from `@/widgets/registry`).
   - `builder-section-renderer.tsx` (renders responsive CSS grid columns and section containers).
3. **Step 3**: Update `components/site/templates/news-home.tsx` to render sections through `BuilderSectionRenderer`.
4. **Step 4**: Upgrade `theme-settings-shell.tsx` to provide visual Section, Row Preset, and Column Dropzone management with the Block/Widget selector modal.
5. **Step 5**: Test with `pnpm tsc --noEmit` to verify 0 errors and confirm flawless rendering.
