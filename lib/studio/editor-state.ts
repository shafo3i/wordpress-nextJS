import type { StudioDocumentData } from "./types"
import { findElementById } from "./tree-helpers"

export const STUDIO_HISTORY_LIMIT = 100
export type StudioPanelMode = "elements" | "inspector"
export interface StudioEditorSnapshot {
  title: string
  status: string
  document: StudioDocumentData
}
export interface StudioEditorState {
  present: StudioEditorSnapshot
  past: StudioEditorSnapshot[]
  future: StudioEditorSnapshot[]
  savedSignature: string
  selectedId: string | null
  panelMode: StudioPanelMode
  isSaving: boolean
  isCurrentFrontPage: boolean
  assignAsFrontPage: boolean
}
export type StudioEditorAction =
  | {
      type: "commit"
      snapshot: StudioEditorSnapshot
      selectedId?: string | null
    }
  | { type: "undo" | "redo" }
  | { type: "select"; id: string | null }
  | { type: "panel"; mode: StudioPanelMode }
  | { type: "frontPage"; value: boolean }
  | { type: "saveStarted" | "saveFailed" }
  | {
      type: "saved"
      baseSignature: string
      snapshot: StudioEditorSnapshot
      assignedFrontPage: boolean
    }

export const studioSnapshotSignature = (
  snapshot: StudioEditorSnapshot
): string => JSON.stringify(snapshot)
export const isStudioEditorDirty = (state: StudioEditorState): boolean =>
  state.assignAsFrontPage ||
  studioSnapshotSignature(state.present) !== state.savedSignature

export function createStudioEditorState(
  snapshot: StudioEditorSnapshot,
  isFrontPage = false
): StudioEditorState {
  const present = structuredClone(snapshot)
  return {
    present,
    past: [],
    future: [],
    savedSignature: studioSnapshotSignature(present),
    selectedId: null,
    panelMode: "elements",
    isSaving: false,
    isCurrentFrontPage: isFrontPage,
    assignAsFrontPage: false,
  }
}

function validateSelection(state: StudioEditorState): StudioEditorState {
  if (
    state.selectedId &&
    !findElementById(state.present.document.elements, state.selectedId)
  ) {
    return { ...state, selectedId: null, panelMode: "elements" }
  }
  return state
}

/** The history entry includes the page title/layout, not just its element tree. */
export function studioEditorReducer(
  state: StudioEditorState,
  action: StudioEditorAction
): StudioEditorState {
  switch (action.type) {
    case "commit": {
      if (
        studioSnapshotSignature(action.snapshot) ===
        studioSnapshotSignature(state.present)
      )
        return state
      return validateSelection({
        ...state,
        past: [...state.past, state.present].slice(-STUDIO_HISTORY_LIMIT),
        present: structuredClone(action.snapshot),
        future: [],
        selectedId:
          action.selectedId === undefined
            ? state.selectedId
            : action.selectedId,
        panelMode: action.selectedId ? "inspector" : state.panelMode,
      })
    }
    case "undo":
      if (!state.past.length) return state
      return validateSelection({
        ...state,
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future].slice(0, STUDIO_HISTORY_LIMIT),
      })
    case "redo":
      if (!state.future.length) return state
      return validateSelection({
        ...state,
        past: [...state.past, state.present].slice(-STUDIO_HISTORY_LIMIT),
        present: state.future[0],
        future: state.future.slice(1),
      })
    case "select":
      return validateSelection({
        ...state,
        selectedId: action.id,
        panelMode: action.id ? "inspector" : "elements",
      })
    case "panel":
      return { ...state, panelMode: action.mode }
    case "frontPage":
      return {
        ...state,
        assignAsFrontPage: !state.isCurrentFrontPage && action.value,
      }
    case "saveStarted":
      return { ...state, isSaving: true }
    case "saveFailed":
      return { ...state, isSaving: false }
    case "saved": {
      // If typing continued while saving, only acknowledge the captured snapshot.
      const unchanged =
        studioSnapshotSignature(state.present) === action.baseSignature
      return validateSelection({
        ...state,
        isSaving: false,
        savedSignature: studioSnapshotSignature(action.snapshot),
        present: unchanged
          ? structuredClone(action.snapshot)
          : { ...state.present, status: action.snapshot.status },
        isCurrentFrontPage:
          state.isCurrentFrontPage || action.assignedFrontPage,
        assignAsFrontPage: action.assignedFrontPage
          ? false
          : state.assignAsFrontPage,
      })
    }
  }
}
