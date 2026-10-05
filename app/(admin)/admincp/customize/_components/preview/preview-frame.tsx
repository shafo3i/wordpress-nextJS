"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  type CustomizerToPreview,
  type PreviewState,
  type PreviewToCustomizer,
  previewUrl,
} from "@/lib/customizer/preview-protocol";
import type { DeviceMode } from "../toolbar";

const DEVICE_WIDTH: Record<DeviceMode, string> = {
  mobile: "w-[375px]",
  tablet: "w-[768px]",
  desktop: "w-full max-w-6xl",
};

/**
 * The preview is a real page in an iframe, so media queries follow the device width and the
 * theme CSS can't touch the admin UI. Unpublished state is pushed in with postMessage.
 */
export function PreviewFrame({
  themeSlug,
  lang,
  state,
  device,
}: {
  themeSlug: string;
  lang?: string;
  state: PreviewState;
  device: DeviceMode;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(state);

  const push = useCallback(() => {
    const message: CustomizerToPreview = { type: "customizer:state", state: latest.current };
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    latest.current = state;
    push();
  }, [state, push]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<PreviewToCustomizer>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "customizer:ready") push();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [push]);

  return (
    <iframe
      ref={frame}
      title="Theme preview"
      src={previewUrl(themeSlug, lang)}
      className={`h-full max-w-full bg-white rounded border border-slate-500/40 shadow-2xl transition-all duration-300 ${DEVICE_WIDTH[device]}`}
    />
  );
}