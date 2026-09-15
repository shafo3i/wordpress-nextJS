# PressForge 📰⚡

> **The Open-Source Editorial Engine & Newsroom CMS for Modern Journalism**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-1.0-brightgreen?logo=databricks)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/pressforge/pressforge/pulls)

**PressForge** is a modern, high-velocity editorial engine built from the ground up for independent publications, investigative newsrooms, and digital media organizations. Combining the familiar architectural patterns of classic publishing systems with Next.js 16 (App Router), PostgreSQL, and reactive component trees, PressForge delivers sub-second page loads, real-time live theme customization, and flexible block-based layouts.

PressForge is **100% free, public, and open-source**. Anyone is welcome to contribute, suggest features, or build plugins and themes!

---

## 🚀 Live Demo & Access Info

| Property | Details |
| :--- | :--- |
| **Public Site** | [https://wordpressnextjs-ten.vercel.app](https://wordpressnextjs-ten.vercel.app) |
| **Admin Sign-In** | [https://wordpressnextjs-ten.vercel.app/cms-admin](https://wordpressnextjs-ten.vercel.app/cms-admin) |
| **Admin Dashboard** | [https://wordpressnextjs-ten.vercel.app/admincp](https://wordpressnextjs-ten.vercel.app/admincp) |
| **Demo Email** | `admin@pressforge.local` |
| **Demo Password** | `Admin123456!` |
| **Role** | `Administrator` |

> 💡 **Quick Login Tip**: The `/cms-admin` sign-in page features a 1-click **"Fill Administrator Credentials"** button for immediate access during evaluations.

### 📊 Feature Status: What Works vs. Known In-Progress Links

| Feature / Area | Status | Details / Notes |
| :--- | :---: | :--- |
| **Newsroom Homepage** | 🟢 Functional | Full reactive layouts, 10+ modular blocks, dynamic mastheads, responsive grids. |
| **Single Article Reader** | 🟢 Functional | Reads dynamic posts from PostgreSQL at `/posts/[slug]`, formatted with author and metadata. |
| **Single Page Template** | 🟢 Functional | Serves authored custom pages at `/[slug]` with published status checks. |
| **Admin Dashboard** | 🟢 Functional | Metrics at a glance (post/page/comment counts), recent activity log, site health status. |
| **Posts Management** | 🟢 Functional | Full CRUD at `/admincp/posts`: create, edit, draft/publish, TinyMCE WYSIWYG, categories, tags, featured images. |
| **Pages Management** | 🟢 Functional | Full CRUD at `/admincp/pages`: create custom pages, edit slugs, publish content. |
| **Appearance & Themes** | 🟢 Functional | Switch seamlessly between 4 themes (*Broadsheet*, *Magazine*, *Midnight*, *Longform*) at `/admincp/themes`. |
| **Live Theme Customizer** | 🟢 Functional | Real-time dual-pane customizer at `/admincp/customize`: live preview, color palettes, fonts, header styles. |
| **Widgets & Sidebars** | 🟢 Functional | Widget management board at `/admincp/widgets`: drag-and-drop into primary/secondary sidebars. |
| **Plugin Architecture** | 🟢 Functional | Dynamic plugin system at `/admincp/plugins`: activate/deactivate plugins and register dynamic widgets. |
| **Categories & Tags** | 🟢 Functional | Taxonomy managers at `/admincp/categories` and `/admincp/tags`. |
| **Category/Tag Archive Pages** | 🟡 In Progress | Tag and category links on posts (`/category/[slug]`, `/tag/[slug]`) currently lack dedicated archive listing templates. |
| **Footer Governance Links** | 🟡 Placeholders | Footer links (*Editorial Standards*, *Privacy*, *Terms*, *Corrections*) return 404 until authored in Pages. |
| **Media Library / Comments Tab** | 🟡 Placeholders | `/admincp/media`, `/admincp/comments`, `/admincp/users`, `/admincp/settings` in the admin menu are UI stubs. |

---

## ✨ Key Highlights

- 🎨 **Live Theme Customizer Engine**: Two-pane customizer with instant reactive preview across Desktop, Tablet, and Mobile viewports without iframe reloads.
- 🗞️ **4 Bundled Editorial Themes**:
  - **PressForge Broadsheet**: Flagship newspaper of record format with classic serif headlines, double borders, and multi-column wire grids.
  - **PressForge Magazine**: High-impact digital magazine featuring bento grid hero cards, trending feeds, and multimedia spotlights.
  - **PressForge Midnight**: Sleek, high-contrast dark theme engineered for financial terminals, technology reviews, and night-time digital journalism.
  - **PressForge Longform**: Distraction-free, warm paper tone designed for deep investigative storytelling and literary essays.
- 🧱 **10+ Modular Editorial Blocks**:
  - Bento Mega-Grid (1 Hero + 4 Cards)
  - Broadsheet 3-Column Wire (Regional, Center Lead, Live Wire Desk)
  - Interactive Hero Filmstrip Carousel
  - Big Lead + Contextual Side List (Left or Right Lead)
  - Chronological News List View (Left or Right Thumbnails)
  - Multi-Column Story Cards Grid (3 or 4 Columns)
  - Visual Photo Tiles with Gradient Overlays
  - Minimalist Text-Only Wire
  - Interactive Tabbed Topic Switcher
  - Studio Multimedia Audio Stream
- 🧩 **Extensible Plugin & Widget System**:
  - Drag-and-drop sidebars (Primary, Secondary, Full Width, Left, Right).
  - Pre-built editorial widgets: Morning Dispatch Newsletter, Live Audio Briefing, Verified Claim Fact-Check, Reading Velocity Calculator, and Recent Posts.
  - Active plugins auto-register widgets directly into the customizer and sidebar management panels.
- 🗄️ **WordPress Architecture Compatibility**:
  - Backwards-compatible schema integration with WordPress option trees (`theme_mods_*`, `sidebars_widgets`, `active_plugins`).
  - Seamless migration path for existing WordPress content, taxonomies, and options.
- 🔐 **Role-Based Access Control (RBAC)**:
  - Granular roles: `Administrator`, `Editor`, `Author`, `Contributor`, `Subscriber`.
  - Next.js server-side route middleware protection.
- ✍️ **Rich Editorial Suite**: Integrated TinyMCE editor, post scheduling, revision history, and category/tag taxonomies.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) | Fast server-side rendering, streaming, and static site generation |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Full type safety across models, components, and actions |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | Robust, production-grade relational storage |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | High-performance, lightweight database queries and migrations |
| **Auth** | [Better-Auth](https://www.better-auth.com/) | Secure session management, password hashing, and user roles |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + CSS Variables | Dynamic palette switching and Google Fonts integration |
| **Editor** | [TinyMCE React](https://www.tiny.cloud/) | WYSIWYG editorial authoring experience |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible vector icons |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later)
- [pnpm](https://pnpm.io/) (v9.x or later)
- [PostgreSQL](https://www.postgresql.org/) database instance

### 1. Clone the Repository

```bash
git clone https://github.com/<YOUR_USERNAME>/pressforge.git
cd pressforge
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/pressforge_db"

# Better Auth Secret & Base URL
BETTER_AUTH_SECRET="your-super-secret-random-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Initialize the Database & Run Seed

Push the database schema and populate starter editorial templates:

```bash
# Push schema tables to your PostgreSQL database
pnpm db:push

# Seed starter newsroom articles, categories, menus, and users
pnpm db:seed
```

### 5. Launch the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public publication, or visit [http://localhost:3000/admincp](http://localhost:3000/admincp) to access the newsroom administration panel.

---

## 📁 Project Structure

```
pressforge/
├── app/
│   ├── (admin)/admincp/          # Newsroom admin panel, themes, customizer, widgets
│   ├── (auth)/                   # Authentication routes (login, register)
│   ├── [slug]/                   # Dynamic editorial page templates
│   ├── posts/[slug]/             # Single article story view
│   ├── globals.css               # Global theme tokens and styles
│   └── page.tsx                  # Public homepage
├── components/
│   ├── admin/                    # Admin UI (customizer shell, theme settings, widget boards)
│   ├── auth/                     # Authentication forms and status cards
│   ├── site/
│   │   ├── blocks/               # 10 editorial layout blocks (bento, wire, grid, etc.)
│   │   ├── footer/               # Modular site footer
│   │   ├── header/               # Modular masthead & navigation layouts
│   │   ├── sidebar/              # Widget area and plugin widget renderers
│   │   ├── templates/            # NewsHome, PostTemplate, PageTemplate
│   │   ├── section-header.tsx    # Styled section dividers
│   │   ├── theme-dynamic-styles.tsx # CSS variable & Google Font injector
│   │   └── utils.ts              # Formatters and theme context helpers
│   └── ui/                       # Reusable UI primitives (inputs, buttons, modals)
├── db/
│   ├── schema/                   # Drizzle ORM schema definitions (posts, options, auth)
│   └── index.ts                  # Database client instance
├── lib/
│   ├── themes/                   # Theme loader, types, and customizer persistence
│   ├── widgets/                  # Sidebar widget definitions and DB actions
│   ├── plugins/                  # Plugin discovery and hook system
│   └── site-theme.ts             # Theme context builder
├── plugins/                      # Dynamic plugin bundles (audio, newsletter, fact-check)
├── scripts/                      # Database seeders and maintenance scripts
└── templates/                    # JSON seeds for posts, pages, taxonomies, and options
```

---

## 🤝 Contributing

PressForge is an open-source community project, and contributions of all kinds are warmly welcomed! Whether you are fixing a bug, adding an editorial block, translating strings, or designing a new theme:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-editorial-block
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat: add 5-column photography grid block"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/amazing-editorial-block
   ```
5. **Open a Pull Request**: Submit a PR to the `main` branch with a clear description of your improvements and screenshots if applicable.

---

## 📄 License

This project is licensed under the **[MIT License](LICENSE)** — feel free to use, modify, and distribute it for both commercial and personal newsrooms.
