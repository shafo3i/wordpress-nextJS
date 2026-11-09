"use client"
import { createContext, useContext, type ReactNode } from "react"
import { getGoogleFontsUrl } from "@/lib/customizer/fonts"
import type { StudioDesign } from "@/db/schema/cms-studio-design"
import {
  studioDesignPresentation,
  studioDesignForDevice,
} from "@/lib/studio/design"
import styles from "./studio-design.module.css"

const PreviewDevice = createContext<
  "desktop" | "tablet" | "mobile" | undefined
>(undefined)
export function useStudioPreviewDevice() {
  return useContext(PreviewDevice)
}

export function StudioDesignViewport({
  device,
  children,
}: {
  device?: "desktop" | "tablet" | "mobile"
  children: ReactNode
}) {
  return (
    <PreviewDevice.Provider value={device}>{children}</PreviewDevice.Provider>
  )
}

export function StudioDesignSurface({
  design,
  children,
}: {
  design?: StudioDesign
  children: ReactNode
}) {
  const previewDevice = useContext(PreviewDevice)
  const { style, attributes } = studioDesignPresentation(
    studioDesignForDevice(design, previewDevice)
  )
  const fontUrl = getGoogleFontsUrl(
    Object.values(design?.typography || {}).flatMap((devices) =>
      Object.values(devices || {}).map((values) => values?.family)
    )
  )
  return (
    <div className={styles.design} style={style} {...attributes}>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      {children}
    </div>
  )
}
