"use client"

import { useEffect, useState } from "react"

export function useNewsRotation(
  count: number,
  autoplay = true,
  interval = 5500,
  advance = true
) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const currentIndex = count ? index % count : 0
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    if (
      !advance ||
      !autoplay ||
      paused ||
      hovered ||
      focused ||
      reducedMotion ||
      count < 2
    )
      return
    const timer = window.setInterval(
      () => {
        if (!document.hidden) setIndex((value) => (value + 1) % count)
      },
      Math.max(2000, Math.min(30000, interval))
    )
    return () => window.clearInterval(timer)
  }, [
    advance,
    autoplay,
    paused,
    hovered,
    focused,
    reducedMotion,
    count,
    interval,
  ])
  return {
    index: currentIndex,
    select: (value: number) => setIndex(value),
    next: () => setIndex((currentIndex + 1) % Math.max(1, count)),
    previous: () => setIndex((currentIndex - 1 + count) % Math.max(1, count)),
    paused,
    stopped: paused || hovered || focused || reducedMotion,
    togglePause: () => setPaused((value) => !value),
    canAutoplay: autoplay && !reducedMotion && count > 1,
    interactionProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      },
    },
  }
}
