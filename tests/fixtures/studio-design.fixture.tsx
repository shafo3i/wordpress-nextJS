import { effectiveStudioDesign } from "../../lib/studio/design"
import { Broadsheet3ColBlock } from "../../components/site/blocks/broadsheet"
import { DualCategoryColumnsBlock } from "../../components/site/blocks/dual-category"
import { createRoot } from "react-dom/client"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { useSyncExternalStore } from "react"
import { createStudioEditorStore } from "../../lib/studio/editor-store"
import { useState } from "react"
import { StudioStyleControls } from "../../app/(admin)/admincp/studio/[id]/_components/studio-style-controls"
import {
  StudioDesignSurface,
  StudioDesignViewport,
} from "../../components/site/studio/studio-design"
import { HeadlineSliderBlock } from "../../components/site/blocks/headline-slider"
import { CompactPostsBlock } from "../../components/site/blocks/compact-posts"
import { NewsListViewBlock } from "../../components/site/blocks/news-list"
import { MinimalTextWireBlock } from "../../components/site/blocks/minimal-text"
import { DEFAULT_THEME } from "../../components/site/utils"
import { createStudioElement } from "../../lib/studio/tree-helpers"
import { studioSettingsSchema } from "../../db/schema/cms-studio"
import type { StudioElementSettings } from "../../lib/studio/types"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"

let root: ReturnType<typeof createRoot>
let saved: StudioElementSettings | undefined
let generation = 0
let hydrationErrors: string[] = []
export function hydrateEditor() {
  hydrationErrors = []
  const store = createStudioEditorStore({
    title: "Page",
    status: "draft",
    document: { version: "1.0", pageTemplate: "studio_canvas", elements: [] },
  })
  function Undo() {
    const state = useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot
    )
    return <button disabled={!state.past.length}>Hydration undo</button>
  }
  const host = document.createElement("div")
  host.id = "hydration-preview"
  host.innerHTML = renderToString(<Undo />)
  document.body.append(host)
  store.setTitle("Edited before hydration")
  hydrateRoot(host, <Undo />, {
    onRecoverableError: (error) => hydrationErrors.push(String(error)),
  })
}
export function getHydrationErrors() {
  return hydrationErrors
}
function Fixture({
  mode,
  rtl,
  width,
  previewDevice,
  count,
}: {
  mode: string
  rtl: boolean
  width: number
  count: number
  previewDevice?: "desktop" | "tablet" | "mobile"
}) {
  const [element, setElement] = useState(() => ({
    ...createStudioElement("block_recent_posts"),
    settings: saved || createStudioElement("block_recent_posts").settings,
  }))
  const theme = {
    ...DEFAULT_THEME,
    locale: rtl ? "ar" : "en",
    direction: rtl ? ("rtl" as const) : ("ltr" as const),
    dict: rtl ? ar : en,
  }
  const posts = Array.from({ length: count }, (_, index) => ({
    id: String(index),
    slug: `story-${index}`,
    title: rtl
      ? "المتطوعون وراء عطلة رياضية مجتمعية"
      : "The volunteers behind a community sports weekend",
    excerpt: rtl
      ? "تفاصيل المقال والخدمات المتاحة للمجتمع."
      : "A short editorial summary with clear spacing and readable typography.",
    date: new Date("2026-10-15T12:00:00Z"),
    content: "",
    authorName: "Test author",
    categories: [rtl ? "الرياضة" : "Sport"],
    tags: [],
    imageUrl: "https://fixture-images.test/photo.svg",
  }))
  return (
    <main
      dir={theme.direction}
      style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: 8 }}
    >
      <aside style={{ width: 260, flexShrink: 0 }}>
        <StudioStyleControls
          dict={theme.dict}
          selectedElement={element}
          onUpdateSettings={(_, patch) => {
            const settings = studioSettingsSchema.parse({
              ...element.settings,
              ...patch,
            })
            saved = JSON.parse(JSON.stringify(settings))
            setElement({ ...element, settings })
          }}
        />
      </aside>
      <div id="preview" style={{ width, minWidth: 0, flexShrink: 0 }}>
        <StudioDesignViewport device={previewDevice}>
          <StudioDesignSurface design={effectiveStudioDesign(element.settings)}>
            {mode === "broadsheet" ? (
              <Broadsheet3ColBlock posts={posts} title="Section" theme={theme} />
            ) : mode === "dual" ? (
              <DualCategoryColumnsBlock posts={posts} title="Section" theme={theme} />
            ) : mode === "headline" ? (
              <HeadlineSliderBlock
                posts={posts}
                title=""
                theme={theme}
                autoplay={false}
                showExcerpt
              />
            ) : mode === "list" ? (
              <NewsListViewBlock posts={posts} title="Section" theme={theme} />
            ) : mode === "wire" ? (
              <MinimalTextWireBlock posts={posts} title="Section" theme={theme} />
            ) : (
              <CompactPostsBlock
                posts={posts}
                block={element.settings.blockConfig!}
                theme={theme}
                design={element.settings.design}
              />
            )}
          </StudioDesignSurface>
        </StudioDesignViewport>
      </div>
    </main>
  )
}
export function render(
  mode = "compact",
  rtl = false,
  width = 300,
  reset = true,
  previewDevice?: "desktop" | "tablet" | "mobile",
  count = 3
) {
  if (reset) saved = undefined
  root ??= createRoot(document.getElementById("fixture")!)
  root.render(
    <Fixture
      key={++generation}
      mode={mode}
      rtl={rtl}
      width={width}
      count={count}
      previewDevice={previewDevice}
    />
  )
}
