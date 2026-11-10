import { buildThemeCss } from "@/lib/customizer/css"
import React from "react"
import { createRoot } from "react-dom/client"
import { StudioRenderer } from "@/components/site/studio/studio-renderer"
import { DEFAULT_THEME } from "@/components/site/utils"
import type { StudioElementSettings } from "@/lib/studio/types"
let root: ReturnType<typeof createRoot>
export function render(
  direction: "rtl" | "ltr",
  settings: StudioElementSettings = {}
) {
  root ||= createRoot(document.getElementById("fixture")!)
  root.render(
    <div dir={direction}>
      <nav className="theme-container mx-auto">
        <span id="nav-start">Navigation</span>
      </nav>
      <StudioRenderer
        theme={{ ...DEFAULT_THEME, direction }}
        posts={[]}
        elements={[
          {
            id: "frame",
            elType: "container",
            widgetType: "container",
            settings: { paddingLeft: 16, paddingRight: 16, ...settings },
            elements: [],
          },
        ]}
      />
    </div>
  )
}

export function setWidth(width: "1140" | "1280" | "1440" | "1600" | "100%") {
  let style = document.getElementById("site-width-css")
  if (!style) {
    style = document.createElement("style")
    style.id = "site-width-css"
    document.head.append(style)
  }
  style.textContent = buildThemeCss({ containerWidth: width })
}
