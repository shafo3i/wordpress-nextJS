import { describe, expect, it, vi } from "vitest"
import {
  createStudioEditorStore,
  type StudioSaveFunction,
} from "./editor-store"
import { isStudioEditorDirty, STUDIO_HISTORY_LIMIT } from "./editor-state"
import { createStudioContainerFromPreset } from "./tree-helpers"
import type { StudioSaveResult } from "./types"

const create = () =>
  createStudioEditorStore({
    title: "Page",
    status: "draft",
    document: {
      version: "1.0",
      pageTemplate: "studio_canvas",
      elements: [createStudioContainerFromPreset("100")],
    },
  })
const successfulSave: StudioSaveFunction = async (request) => ({
  success: true,
  status: request.status || "draft",
  document: request.document,
})

describe("Studio editing history", () => {
  it("keeps a stable initial snapshot for hydration after edits enter the live store", () => {
    const editor = create()
    const server = editor.getServerSnapshot()
    editor.setTitle("Changed before hydration")
    expect(editor.getSnapshot().past).toHaveLength(1)
    expect(editor.getServerSnapshot()).toBe(server)
    expect(editor.getServerSnapshot().past).toHaveLength(0)
    expect(editor.getServerSnapshot().present.title).toBe("Page")
  })
  it("preserves sequential updates before React renders and undoes/redoes page attributes", () => {
    const editor = create()
    editor.setTitle("One")
    editor.setTitle("Two")
    editor.setTemplate("default")
    editor.undo()
    expect(editor.getSnapshot().present.document.pageTemplate).toBe(
      "studio_canvas"
    )
    editor.undo()
    expect(editor.getSnapshot().present.title).toBe("One")
    editor.redo()
    expect(editor.getSnapshot().present.title).toBe("Two")
  })

  it("drops redo after branching, ignores no-op edits and bounds history", () => {
    const editor = create()
    editor.setTitle("Page")
    expect(editor.getSnapshot().past).toHaveLength(0)
    editor.setTitle("First")
    editor.setTitle("Second")
    editor.undo()
    editor.setTitle("Branch")
    expect(editor.getSnapshot().future).toHaveLength(0)
    for (let i = 0; i < 120; i++) editor.setTitle(`Title ${i}`)
    expect(editor.getSnapshot().past).toHaveLength(STUDIO_HISTORY_LIMIT)
  })

  it("clears selection when its ancestor is deleted", () => {
    const editor = create()
    editor.insert("heading")
    expect(editor.getSnapshot().selectedId).not.toBeNull()
    editor.delete(editor.getSnapshot().present.document.elements[0].id)
    expect(editor.getSnapshot().selectedId).toBeNull()
    expect(editor.getSnapshot().panelMode).toBe("elements")
    editor.undo()
    expect(editor.getSnapshot().present.document.elements).toHaveLength(1)
  })

  it("deeply duplicates widget settings without sharing tab items", () => {
    const editor = create()
    editor.insert("tabs")
    const original = editor.getSnapshot().selectedId!
    editor.duplicate(original)
    const duplicate = editor.getSnapshot().selectedId!
    editor.updateElement(duplicate, (element) => {
      element.settings.tabsItems![0].title = "Clone"
      return element
    })
    const column = editor.getSnapshot().present.document.elements[0].elements[0]
    expect(
      column.elements.find((el) => el.id === original)!.settings.tabsItems![0]
        .title
    ).toBe("")
  })

  it("does not drop a widget into another widget", () => {
    const editor = create()
    editor.insert("heading")
    const before = editor.getSnapshot()
    editor.insert("button", "all", before.selectedId!)
    expect(editor.getSnapshot()).toBe(before)
  })

  it("ignores unrecognized widget names from external drag data", () => {
    const editor = create()
    const before = editor.getSnapshot()
    editor.insert(
      "unknown_external_widget" as Parameters<typeof editor.insert>[0]
    )
    expect(editor.getSnapshot()).toBe(before)
  })

  it("inserts into the actual selected column instead of its first widget", () => {
    const editor = create()
    const columnId =
      editor.getSnapshot().present.document.elements[0].elements[0].id
    editor.select(columnId)
    editor.insert("heading")
    editor.select(columnId)
    editor.insert("button")
    expect(
      editor
        .getSnapshot()
        .present.document.elements[0].elements[0].elements.map(
          (el) => el.widgetType
        )
    ).toEqual(["heading", "button"])
  })
})

describe("Studio saving and dirty tracking", () => {
  it("marks clean after save, dirty after edits, and clean when undo reaches the saved snapshot", async () => {
    const editor = create()
    editor.setTitle("Saved")
    await editor.save("1", successfulSave)
    expect(isStudioEditorDirty(editor.getSnapshot())).toBe(false)
    editor.setTitle("Next")
    expect(isStudioEditorDirty(editor.getSnapshot())).toBe(true)
    editor.undo()
    expect(isStudioEditorDirty(editor.getSnapshot())).toBe(false)
  })

  it("blocks overlapping saves and preserves edits made during the request", async () => {
    const editor = create()
    let resolve!: (result: StudioSaveResult) => void
    const save = vi.fn<StudioSaveFunction>(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    editor.setTitle("Captured")
    const request = editor.save("1", save, { status: "publish" })
    expect((await editor.save("1", save)).busy).toBe(true)
    editor.setTitle("Typed while saving")
    const payload = save.mock.calls[0][0]
    resolve({ success: true, status: "publish", document: payload.document })
    await request
    expect(save).toHaveBeenCalledTimes(1)
    expect(payload.title).toBe("Captured")
    expect(editor.getSnapshot().present.title).toBe("Typed while saving")
    expect(editor.getSnapshot().present.status).toBe("publish")
    expect(isStudioEditorDirty(editor.getSnapshot())).toBe(true)
  })

  it("uses the server's sanitized document when no newer edits exist", async () => {
    const editor = create()
    editor.insert("html")
    editor.updateSettings(editor.getSnapshot().selectedId!, {
      htmlCode: "<p>Safe</p><script>bad()</script>",
    })
    await editor.save("1", async (request) => {
      const document = structuredClone(request.document)
      document.elements[0].elements[0].elements[0].settings.htmlCode =
        "<p>Safe</p>"
      return { success: true, status: "draft", document }
    })
    expect(JSON.stringify(editor.getSnapshot().present.document)).not.toContain(
      "<script>"
    )
    expect(isStudioEditorDirty(editor.getSnapshot())).toBe(false)
  })

  it("recovers from network failures while keeping the document dirty", async () => {
    const editor = create()
    editor.setTitle("Unsaved")
    expect(
      (
        await editor.save("1", async () => {
          throw new Error("Network")
        })
      ).success
    ).toBe(false)
    expect(editor.getSnapshot().isSaving).toBe(false)
    expect(isStudioEditorDirty(editor.getSnapshot())).toBe(true)
    expect((await editor.save("1", successfulSave)).success).toBe(true)
  })

  it("assigns a homepage only after publishing and never pretends to clear an existing assignment", async () => {
    const editor = create()
    const save = vi.fn(successfulSave)
    editor.setFrontPage(true)
    await editor.save("1", save, { status: "draft" })
    expect(save.mock.calls[0][0].setAsFrontPage).toBe(false)
    expect(editor.getSnapshot().assignAsFrontPage).toBe(true)
    await editor.save("1", save, { status: "publish" })
    expect(save.mock.calls[1][0].setAsFrontPage).toBe(true)
    editor.setFrontPage(false)
    expect(editor.getSnapshot().isCurrentFrontPage).toBe(true)
    expect(editor.getSnapshot().assignAsFrontPage).toBe(false)
  })
})
