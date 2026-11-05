import type { StudioElement } from "./types"
import {
  createStudioContainerFromPreset,
  deleteElementFromTree,
  findElementById,
  updateElementInTree,
} from "./tree-helpers"

export type StudioDropPosition =
  "before" | "after" | "inside" | "left" | "right"

/** One immutable move, with identity preserved and ancestor cycles rejected. */
export function relocateStudioElement(
  tree: StudioElement[],
  sourceId: string,
  targetId: string,
  position: StudioDropPosition
): StudioElement[] {
  const source = findElementById(tree, sourceId)
  const target = findElementById(tree, targetId)
  if (
    !source ||
    !target ||
    sourceId === targetId ||
    findElementById(source.elements, targetId)
  )
    return tree
  if (position === "inside" && target.elType !== "container") return tree
  const remaining = deleteElementFromTree(tree, sourceId)
  if (position === "inside")
    return updateElementInTree(remaining, targetId, (node) => ({
      ...node,
      elements: [...node.elements, source],
    }))
  const insert = (nodes: StudioElement[]): StudioElement[] =>
    nodes.flatMap((node) => {
      if (node.id !== targetId)
        return [{ ...node, elements: insert(node.elements) }]
      if (position === "before") return [source, node]
      if (position === "after") return [node, source]
      const row = createStudioContainerFromPreset("50_50")
      Object.assign(row.settings, {
        contentWidth: "full",
        gap: 16,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      })
      const pair = position === "left" ? [source, node] : [node, source]
      row.elements.forEach((column, index) => {
        Object.assign(column.settings, {
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
        })
        column.elements = [pair[index]]
      })
      return [row]
    })
  return insert(remaining)
}
