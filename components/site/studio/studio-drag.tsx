"use client"

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
} from "react"
import type { StudioElement, StudioWidgetType } from "@/lib/studio/types"
import type { StudioDropPosition } from "@/lib/studio/relocate"
import { findElementById } from "@/lib/studio/tree-helpers"

type Destination = { id: string; position: StudioDropPosition }
function locate(
  rect: DOMRect,
  x: number,
  y: number,
  container: boolean
): StudioDropPosition {
  x -= rect.left
  y -= rect.top
  const edge = Math.min(24, rect.height * 0.2)
  if (y < edge) return "before"
  if (y > rect.height - edge) return "after"
  if (x < Math.min(64, rect.width * 0.2)) return "left"
  if (x > rect.width - Math.min(64, rect.width * 0.2)) return "right"
  return container ? "inside" : y < rect.height / 2 ? "before" : "after"
}
export function useStudioDrag(
  enabled: boolean,
  rtl: boolean,
  elements: StudioElement[],
  relocate?: (
    source: string,
    target: string,
    position: StudioDropPosition
  ) => void,
  insert?: (target: string, widget: StudioWidgetType) => void
) {
  const source = useRef<string | null>(null)
  const pointerCleanup = useRef<(() => void) | null>(null)
  useEffect(() => () => pointerCleanup.current?.(), [])
  const [over, setOver] = useState<Destination | null>(null)
  const clear = () => {
    pointerCleanup.current?.()
    pointerCleanup.current = null
    source.current = null
    setOver(null)
  }
  const commit = (id: string, target: string, position: StudioDropPosition) => {
    if (rtl && (position === "left" || position === "right"))
      position = position === "left" ? "right" : "left"
    relocate?.(id, target, position)
  }
  return {
    over,
    handle: (id: string) => ({
      draggable: false,
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!enabled || event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        clear()
        source.current = id
        event.currentTarget.setPointerCapture(event.pointerId)
        const startX = event.clientX,
          startY = event.clientY
        let x = startX,
          y = startY,
          moved = false,
          frame = 0
        let destination: Destination | null = null
        const update = () => {
          if (!moved) return
          const node = document
            .elementFromPoint(x, y)
            ?.closest<HTMLElement>("[data-studio-element]")
          const targetId = node?.dataset.studioElement
          const target = targetId ? findElementById(elements, targetId) : null
          const sourceNode = findElementById(elements, id)
          if (
            !node ||
            !target ||
            targetId === id ||
            (sourceNode && findElementById(sourceNode.elements, targetId!))
          ) {
            destination = null
            setOver(null)
            return
          }
          const next = {
            id: target.id,
            position: locate(
              node.getBoundingClientRect(),
              x,
              y,
              target.elType === "container"
            ),
          }
          destination = next
          setOver((current) =>
            current?.id === next.id && current.position === next.position
              ? current
              : next
          )
        }
        const scroll = () => {
          const canvas = document.querySelector<HTMLElement>(
            "[data-studio-canvas]"
          )
          if (moved && canvas) {
            const bounds = canvas.getBoundingClientRect()
            if (x >= bounds.left && x <= bounds.right) {
              const delta =
                y < bounds.top + 48 ? -16 : y > bounds.bottom - 48 ? 16 : 0
              if (delta) {
                canvas.scrollTop += delta
                update()
              }
            }
          }
          frame = requestAnimationFrame(scroll)
        }
        const move = (next: globalThis.PointerEvent) => {
          x = next.clientX
          y = next.clientY
          moved ||= Math.hypot(x - startX, y - startY) > 4
          update()
        }
        const up = () => {
          if (moved) {
            const suppressClick = (click: MouseEvent) => {
              click.preventDefault()
              click.stopPropagation()
            }
            window.addEventListener("click", suppressClick, {
              capture: true,
              once: true,
            })
            window.setTimeout(
              () => window.removeEventListener("click", suppressClick, true),
              0
            )
            if (destination) commit(id, destination.id, destination.position)
          }
          clear()
        }
        const cancel = () => clear()
        const keydown = (key: KeyboardEvent) => {
          if (key.key === "Escape") clear()
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up, { once: true })
        window.addEventListener("pointercancel", cancel, { once: true })
        window.addEventListener("keydown", keydown)
        pointerCleanup.current = () => {
          cancelAnimationFrame(frame)
          window.removeEventListener("pointermove", move)
          window.removeEventListener("pointerup", up)
          window.removeEventListener("pointercancel", cancel)
          window.removeEventListener("keydown", keydown)
        }
        frame = requestAnimationFrame(scroll)
      },
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.stopPropagation()
        source.current = id
        event.dataTransfer.setData("application/x-studio-element", id)
        event.dataTransfer.effectAllowed = "move"
      },
      onDragEnd: clear,
    }),
    target: (element: StudioElement) => ({
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!enabled) return
        const existing = event.dataTransfer.types.includes(
          "application/x-studio-element"
        )
        if (
          !existing &&
          (element.elType !== "container" ||
            !event.dataTransfer.types.includes("application/x-studio-widget"))
        )
          return
        event.preventDefault()
        event.stopPropagation()
        if (source.current === element.id) return
        const position = existing
          ? locate(
              event.currentTarget.getBoundingClientRect(),
              event.clientX,
              event.clientY,
              element.elType === "container"
            )
          : "inside"
        event.dataTransfer.dropEffect = existing ? "move" : "copy"
        setOver((current) =>
          current?.id === element.id && current.position === position
            ? current
            : { id: element.id, position }
        )
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom
        )
          return
        setOver((current) => (current?.id === element.id ? null : current))
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!enabled) return
        const id = event.dataTransfer.getData("application/x-studio-element")
        const widget = event.dataTransfer.getData("application/x-studio-widget")
        if (!id && (!widget || element.elType !== "container")) return
        event.preventDefault()
        event.stopPropagation()
        if (id)
          commit(
            id,
            element.id,
            locate(
              event.currentTarget.getBoundingClientRect(),
              event.clientX,
              event.clientY,
              element.elType === "container"
            )
          )
        else insert?.(element.id, widget as StudioWidgetType)
        clear()
      },
    }),
  }
}
export function StudioDropIndicator({
  position,
}: {
  position: StudioDropPosition
}) {
  const style =
    position === "inside"
      ? { inset: 4, border: "2px solid #2563eb" }
      : position === "before" || position === "after"
        ? {
            left: 0,
            right: 0,
            height: 3,
            [position === "before" ? "top" : "bottom"]: 0,
            background: "#2563eb",
          }
        : { top: 0, bottom: 0, width: 3, [position]: 0, background: "#2563eb" }
  return (
    <div
      aria-hidden="true"
      data-studio-drop-position={position}
      className="pointer-events-none absolute z-40"
      style={style}
    />
  )
}
