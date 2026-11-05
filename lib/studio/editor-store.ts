import {
  createStudioEditorState,
  studioEditorReducer,
  studioSnapshotSignature,
  type StudioEditorAction,
  type StudioEditorSnapshot,
  type StudioPanelMode,
} from "./editor-state"
import {
  createStarterTemplateElements,
  createStudioContainerFromPreset,
  createStudioElement,
  deleteElementFromTree,
  duplicateElementInTree,
  findElementById,
  insertElementIntoContainer,
  moveElementInTree,
  updateElementInTree,
  updateElementSettingsInTree,
} from "./tree-helpers"
import { getStudioWidgetDefinition } from "./widget-registry"
import { relocateStudioElement, type StudioDropPosition } from "./relocate"
import type {
  StudioElement,
  StudioElementSettings,
  StudioPageTemplate,
  StudioSaveRequest,
  StudioSaveResult,
  StudioStructurePreset,
  StudioWidgetType,
} from "./types"

export interface StudioPublishOptions {
  status?: string
  setAsFrontPage?: boolean
}
export type StudioSaveFunction = (
  input: StudioSaveRequest
) => Promise<StudioSaveResult>

/** Per-editor store. Commands always read current state, including batched events. */
export function createStudioEditorStore(
  initial: StudioEditorSnapshot,
  isFrontPage = false
) {
  let state = createStudioEditorState(initial, isFrontPage)
  const listeners = new Set<() => void>()
  const dispatch = (action: StudioEditorAction) => {
    const next = studioEditorReducer(state, action)
    if (next !== state) {
      state = next
      listeners.forEach((listener) => listener())
    }
  }
  const commitElements = (elements: StudioElement[], selectedId?: string) =>
    dispatch({
      type: "commit",
      snapshot: {
        ...state.present,
        document: { ...state.present.document, elements },
      },
      selectedId,
    })
  const store = {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    select: (id: string | null) => dispatch({ type: "select", id }),
    setPanelMode: (mode: StudioPanelMode) => dispatch({ type: "panel", mode }),
    setFrontPage: (value: boolean) => dispatch({ type: "frontPage", value }),
    setTitle: (title: string) =>
      dispatch({ type: "commit", snapshot: { ...state.present, title } }),
    setTemplate: (pageTemplate: StudioPageTemplate) =>
      dispatch({
        type: "commit",
        snapshot: {
          ...state.present,
          document: {
            ...state.present.document,
            pageTemplate,
            settings: state.present.document.settings
              ? { ...state.present.document.settings, pageTemplate }
              : undefined,
          },
        },
      }),
    updateElement: (
      id: string,
      updater: (element: StudioElement) => StudioElement
    ) =>
      commitElements(
        updateElementInTree(state.present.document.elements, id, (element) =>
          updater(structuredClone(element))
        )
      ),
    updateSettings: (id: string, patch: Partial<StudioElementSettings>) =>
      commitElements(
        updateElementSettingsInTree(
          state.present.document.elements,
          id,
          structuredClone(patch)
        )
      ),
    move: (id: string, direction: "up" | "down") =>
      commitElements(
        moveElementInTree(state.present.document.elements, id, direction)
      ),
    relocate: (
      sourceId: string,
      targetId: string,
      position: StudioDropPosition
    ) => {
      const elements = state.present.document.elements
      const next = relocateStudioElement(elements, sourceId, targetId, position)
      if (next !== elements) commitElements(next, sourceId)
    },
    duplicate: (id: string) => {
      const result = duplicateElementInTree(state.present.document.elements, id)
      if (result.newId) commitElements(result.tree, result.newId)
    },
    delete: (id: string) =>
      commitElements(
        deleteElementFromTree(state.present.document.elements, id)
      ),
    toggleHidden: (id: string) =>
      commitElements(
        updateElementInTree(state.present.document.elements, id, (element) => ({
          ...element,
          hidden: !element.hidden,
        }))
      ),
    insert: (
      widgetType: StudioWidgetType,
      category = "all",
      containerId?: string
    ) => {
      if (!getStudioWidgetDefinition(widgetType)) return
      const elements = state.present.document.elements
      const element = createStudioElement(widgetType, category)
      if (containerId) {
        if (findElementById(elements, containerId)?.elType !== "container")
          return
        commitElements(
          insertElementIntoContainer(elements, containerId, element),
          element.id
        )
        return
      }
      if (element.elType === "container") {
        commitElements([...elements, element], element.id)
        return
      }
      const selected = findElementById(elements, state.selectedId)
      const container =
        selected?.elType === "container"
          ? selected
          : [...elements].reverse().find((item) => item.elType === "container")
      if (container) {
        const target =
          container.elements.find((item) => item.elType === "container") ||
          container
        commitElements(
          insertElementIntoContainer(elements, target.id, element),
          element.id
        )
      } else {
        const wrapper = createStudioContainerFromPreset("100")
        wrapper.elements[0].elements.push(element)
        commitElements([...elements, wrapper], element.id)
      }
    },
    addPreset: (preset: StudioStructurePreset) => {
      const element = createStudioContainerFromPreset(preset)
      commitElements([...state.present.document.elements, element], element.id)
    },
    insertTemplate: (id: Parameters<typeof createStarterTemplateElements>[0]) =>
      commitElements([
        ...state.present.document.elements,
        ...createStarterTemplateElements(id),
      ]),
    save: async (
      pageId: string,
      save: StudioSaveFunction,
      options: StudioPublishOptions = {}
    ): Promise<{ success: boolean; busy?: boolean }> => {
      if (state.isSaving) return { success: false, busy: true }
      const captured = structuredClone(state.present)
      const baseSignature = studioSnapshotSignature(captured)
      const status = options.status || captured.status
      const setAsFrontPage =
        status === "publish" &&
        (options.setAsFrontPage ?? state.assignAsFrontPage)
      dispatch({ type: "saveStarted" })
      try {
        const result = await save({
          pageId,
          title: captured.title,
          status,
          template: captured.document.pageTemplate,
          document: captured.document,
          setAsFrontPage,
        })
        if (!result.success) {
          dispatch({ type: "saveFailed" })
          return { success: false }
        }
        dispatch({
          type: "saved",
          baseSignature,
          snapshot: {
            title: captured.title.trim(),
            status: result.status,
            document: result.document,
          },
          assignedFrontPage: setAsFrontPage,
        })
        return { success: true }
      } catch {
        dispatch({ type: "saveFailed" })
        return { success: false }
      }
    },
  }
  return store
}
