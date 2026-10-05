"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomizerPayload } from "@/lib/themes/types";
import type { Mods, Palette, SettingDef, SettingValue } from "@/lib/customizer/types";
import { applyPalette, getThemeDefaultMods } from "@/lib/customizer/resolve";
import { getThemeSettings, indexSettings } from "@/lib/customizer/registry";
import { saveCustomizerAction } from "@/app/(admin)/admincp/customize/actions";

type Notice = { type: "success" | "error"; message: string };

const NOTICE_MS = 3500;

/** State, dirty tracking, publish and reset for the customizer. UI components stay presentational. */
export function useCustomizer(initialData: CustomizerPayload, dict?: Record<string, string>) {
  const router = useRouter();
  const themeSlug = initialData.themeSlug;

  const [mods, setMods] = useState<Mods>(initialData.mods);
  const [siteTitle, setSiteTitle] = useState(initialData.siteTitle);
  const [siteTagline, setSiteTagline] = useState(initialData.siteTagline);
  const [isDirty, setIsDirty] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPending, startTransition] = useTransition();
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const settings = useMemo(() => getThemeSettings(themeSlug), [themeSlug]);
  const settingsById = useMemo(() => indexSettings(settings), [settings]);
  const defaults = useMemo(() => getThemeDefaultMods(themeSlug), [themeSlug]);

  /** Mods plus the identity fields, so controls can read every setting by id. */
  const values = useMemo(() => ({ ...mods, siteTitle, siteTagline }) as Mods, [mods, siteTitle, siteTagline]);

  const showNotice = useCallback((next: Notice) => {
    clearTimeout(noticeTimer.current);
    setNotice(next);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const setValue = useCallback((setting: SettingDef, value: SettingValue) => {
    if (setting.store === "site") {
      if (setting.id === "siteTitle") setSiteTitle(String(value ?? ""));
      else setSiteTagline(String(value ?? ""));
    } else {
      setMods((current) => ({ ...current, [setting.id]: value }));
    }
    setIsDirty(true);
  }, []);

  const applyPalettePreset = useCallback(
    (palette: Palette) => {
      setMods((current) => applyPalette(current, palette, settings));
      setIsDirty(true);
    },
    [settings]
  );

  const resetDefaults = useCallback(() => {
    setMods({ ...defaults });
    setIsDirty(true);
    showNotice({
      type: "success",
      message: dict?.["admin.customizer.notice.reset"] || "Reset to theme defaults (Click Publish to save).",
    });
  }, [defaults, dict, showNotice]);

  const publish = useCallback(
    (activate = false) => {
      startTransition(async () => {
        const res = await saveCustomizerAction(themeSlug, mods, { siteTitle, siteTagline }, activate);

        if (!res.success) {
          showNotice({
            type: "error",
            message: res.error || dict?.["admin.customizer.notice.failed"] || "Failed to publish customizer settings.",
          });
          return;
        }

        setIsDirty(false);
        showNotice({
          type: "success",
          message: activate
            ? dict?.["admin.customizer.notice.activated"] || "Theme activated and published!"
            : dict?.["admin.customizer.notice.published"] || "Customizations published successfully!",
        });
        router.refresh();
      });
    },
    [themeSlug, mods, siteTitle, siteTagline, dict, router, showNotice]
  );

  /** The page is keyed by theme slug, so navigating loads that theme's saved settings. */
  const switchTheme = useCallback(
    (slug: string) => {
      if (slug === themeSlug) return;
      const message =
        dict?.["admin.customizer.confirm_switch"] || "You have unpublished changes. Switch theme and discard them?";
      if (isDirty && !window.confirm(message)) return;
      setIsDirty(false);
      startTransition(() => router.push(`/admincp/customize?theme=${slug}`));
    },
    [themeSlug, isDirty, dict, router]
  );

  return {
    themeSlug,
    mods,
    values,
    siteTitle,
    siteTagline,
    defaults,
    settingsById,
    isDirty,
    isPending,
    notice,
    setValue,
    applyPalette: applyPalettePreset,
    resetDefaults,
    publish,
    switchTheme,
  };
}
