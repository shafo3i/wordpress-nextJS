<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Strict Scope & Modification Policy (CRITICAL MANDATORY RULE)

- **NEVER touch, modify, refactor, or edit ANY file, module, feature, or component that the user did not explicitly ask for.**
- Work on **ONE thing at a time**. Do not anticipate, expand scope, or proactively change other pages/modules (e.g. NEVER touch Posts, Themes, Frontend, or any other area when asked to fix Comments).
- Only make changes strictly and directly requested. Always stop and wait for explicit confirmation from the user before touching anything else.

# PressForge Admin CRUD Architecture & UI Standards (MANDATORY)

For **all** administrative modules under `app/(admin)/admincp/`, you **MUST** strictly follow the structure and standards defined in `docs/ADMIN_CRUD_STANDARDS.md` (based on the `comments` module):

1. **Folder Architecture**:
   - `action.ts`: Server actions for mutations. **Never duplicate validation schemas here** — parse directly with `create<Entity>Schema.parse(Object.fromEntries(formData))` imported from `db/schema/`.
   - `query.ts`: Queries protected with `verifyAdminOrEditor()`. Must return `{ items, total }` with pagination slices.
   - `page.tsx`: Server component wrapped in `<AdminShell>`.
   - `_components/`: Separate, dedicated components (`<entity>-table.tsx`, `<entity>-form.tsx`, `<entity>-filter.tsx`, `<entity>-pagination.tsx`, `index.ts`). Never combine them into a single monolithic file.

2. **Schema & Validation**:
   - Single source of truth in `db/schema/` using Drizzle-Zod `createInsertSchema` with `z.preprocess` for numeric/IDs and `.omit()` for auto fields.
   - Export `SelectEntity`, `InsertEntity` (`z.input`), and `InsertEntityOutput` (`z.output`).

3. **Strict WordPress Admin Styling (DO NOT INVENT NEW STYLES)**:
   - **Views Navigation**: Pipe-separated status counts `All (N) | ...` with active item in bold `#1d2327`, links in `#2271b1`.
   - **Search Box**: Top-right WordPress style input (`h-[30px] border-[#8c8f94]`) with button (`h-[30px] border-[#2271b1] bg-[#f6f7f7] text-[#2271b1]`).
   - **Pagination**: Authentic `26px × 26px` square navigation buttons (`«`, `‹`, `›`, `»`), items count (`X items`), and page count (`X of Y`). **Always visible** (never hide when `totalPages <= 1`).
   - **Tables**: WordPress Widefat table (`border border-[#c3c4c7] bg-white`, header `bg-[#f6f7f7]`).
   - **Forms**: Standard WordPress form controls (`h-[30px] border-[#8c8f94]`, primary button `#2271b1`, cancel `#f6f7f7`).

4. **Admin Back Office Language Filtering (MANDATORY)**:
   - In Admin CP content list screens (e.g., Comments, Posts, Pages, etc.), the tablenav filter bar **MUST** include a **Language filter dropdown** (`All languages` / `جميع اللغات`, plus all active database languages).
   - By default, regardless of which language the admin UI is displayed in, the admin sees all content across all languages.
   - When an admin selects a specific language from the filter dropdown, content is filtered strictly by that language.
   - The selected language filter must be preserved across search submissions, status view tabs, and pagination navigation.
