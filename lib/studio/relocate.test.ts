import { describe, expect, it } from "vitest"
import { relocateStudioElement } from "./relocate"
import {
  createStudioContainerFromPreset,
  createStudioElement,
  findElementById,
} from "./tree-helpers"
import { createStudioEditorStore } from "./editor-store"
import { studioDocumentSchema } from "@/db/schema/cms-studio"
import type { StudioElement } from "./types"

const setup = () => {
  const row = createStudioContainerFromPreset("50_50")
  const source = createStudioElement("block_breaking_ticker")
  source.settings.blockConfig!.title = "Keep this title"
  source.settings.paddingTop = 8
  const target = createStudioElement("heading")
  row.elements[0].elements = [source, target]
  return { tree: [row], source, target, column: row.elements[1] }
}
const ids = (nodes: StudioElement[]): string[] =>
  nodes.flatMap((node) => [node.id, ...ids(node.elements)])

describe("Studio canvas moves", () => {
  it("moves between columns without losing IDs, content or settings", () => {
    const { tree, source, column } = setup()
    const original = structuredClone(tree)
    const result = relocateStudioElement(tree, source.id, column.id, "inside")
    expect(findElementById(result, column.id)!.elements).toEqual([source])
    expect(new Set(ids(result)).size).toBe(ids(result).length)
    expect(tree).toEqual(original)
    expect(ids(result).sort()).toEqual(ids(tree).sort())
  })
  it.each(["before", "after"] as const)("reorders %s a sibling", (position) => {
    const { tree, source, target } = setup()
    const result = relocateStudioElement(tree, source.id, target.id, position)
    expect(result[0].elements[0].elements.map((node) => node.id)).toEqual(
      position === "before" ? [source.id, target.id] : [target.id, source.id]
    )
  })
  it.each(["left", "right"] as const)(
    "creates a saveable %s column without adding padding",
    (position) => {
      const { tree, source, target } = setup()
      const result = relocateStudioElement(tree, source.id, target.id, position)
      const row = result[0].elements[0].elements[0]
      expect(row.settings.paddingTop).toBe(0)
      expect(row.elements.map((col) => col.elements[0].id)).toEqual(
        position === "left" ? [source.id, target.id] : [target.id, source.id]
      )
      expect(
        studioDocumentSchema.safeParse({
          version: "1.0",
          pageTemplate: "studio_full_width",
          elements: result,
        }).success
      ).toBe(true)
    }
  )
  it("rejects self moves, missing targets and ancestor cycles", () => {
    const { tree, source, target } = setup()
    expect(relocateStudioElement(tree, tree[0].id, source.id, "inside")).toBe(
      tree
    )
    expect(relocateStudioElement(tree, source.id, source.id, "left")).toBe(tree)
    expect(relocateStudioElement(tree, source.id, "missing", "after")).toBe(
      tree
    )
    expect(relocateStudioElement(tree, source.id, target.id, "inside")).toBe(
      tree
    )
  })
  it("undoes and redoes a cross-container move as one edit", () => {
    const { tree, source, column } = setup()
    const editor = createStudioEditorStore({
      title: "Page",
      status: "draft",
      document: {
        version: "1.0",
        pageTemplate: "studio_canvas",
        elements: tree,
      },
    })
    editor.relocate(source.id, column.id, "inside")
    expect(editor.getSnapshot().past).toHaveLength(1)
    expect(editor.getSnapshot().selectedId).toBe(source.id)
    editor.undo()
    expect(editor.getSnapshot().present.document.elements).toEqual(tree)
    editor.redo()
    expect(
      findElementById(
        editor.getSnapshot().present.document.elements,
        column.id
      )!.elements[0].id
    ).toBe(source.id)
  })
})
