"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { createStudioEditorStore } from "./editor-store"
import { isStudioEditorDirty, type StudioEditorSnapshot } from "./editor-state"
import { findElementById } from "./tree-helpers"

export function useStudioEditor(
  initial: StudioEditorSnapshot,
  isFrontPage: boolean
) {
  const [store] = useState(() => createStudioEditorStore(initial, isFrontPage))
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  const isDirty = isStudioEditorDirty(state)
  useEffect(() => {
    if (!isDirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [isDirty])
  return {
    state,
    store,
    isDirty,
    selectedElement: findElementById(
      state.present.document.elements,
      state.selectedId
    ),
  }
}
