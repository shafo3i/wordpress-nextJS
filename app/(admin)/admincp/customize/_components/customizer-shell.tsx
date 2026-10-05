"use client";

import { useMemo, useState } from "react";
import type { CustomizerSection } from "@/lib/customizer/types";
import type { PreviewState } from "@/lib/customizer/preview-protocol";
import { CustomizerToolbar, type DeviceMode, type PreviewLanguage, type PreviewPage } from "./toolbar";
import { SectionPanel } from "./section-panel";
import { PreviewFrame } from "./preview/preview-frame";
import { useCustomizer } from "./use-customizer";
import type { CustomizeData } from "./types";

export function CustomizerShell({
  initialData,
  dict,
  direction = "ltr",
  languages = [],
  defaultPreviewLang,
}: {
  initialData: CustomizeData;
  languages?: PreviewLanguage[];
  /** Language the preview starts in, usually the admin language. */
  defaultPreviewLang?: string;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const customizer = useCustomizer(initialData, dict);
  const [activeSection, setActiveSection] = useState<string | null>("colors");
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [previewPage, setPreviewPage] = useState<PreviewPage>("home");
  const [previewLang, setPreviewLang] = useState(defaultPreviewLang ?? languages[0]?.code ?? "en");

  const currentTheme =
    initialData.allThemes.find((theme) => theme.slug === customizer.themeSlug) ?? initialData.allThemes[0];

  const previewState = useMemo<PreviewState>(
    () => ({
      mods: customizer.mods,
      siteTitle: customizer.siteTitle,
      siteTagline: customizer.siteTagline,
      page: previewPage,
    }),
    [customizer.mods, customizer.siteTitle, customizer.siteTagline, previewPage]
  );

  const toggleSection = (section: CustomizerSection) => {
    const next = activeSection === section.id ? null : section.id;
    setActiveSection(next);
    if (next && section.previewPage) setPreviewPage(section.previewPage);
  };

  return (
    <div dir={direction} className="fixed inset-0 z-50 flex flex-col bg-[#f0f0f1] text-[13px] font-sans text-start">

      <CustomizerToolbar
        themes={initialData.allThemes}
        themeSlug={customizer.themeSlug}
        activeThemeSlug={initialData.activeThemeSlug}
        notice={customizer.notice}
        previewPage={previewPage}
        onPreviewPage={setPreviewPage}
        languages={languages}
        previewLang={previewLang}
        onPreviewLang={setPreviewLang}
        deviceMode={device}
        onDeviceMode={setDevice}
        isDirty={customizer.isDirty}
        isPending={customizer.isPending}
        onSwitchTheme={customizer.switchTheme}
        onReset={customizer.resetDefaults}
        onPublish={customizer.publish}
        dict={dict}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 sm:w-[360px] flex-shrink-0 border-e border-[#c3c4c7] bg-[#f0f0f1] overflow-y-auto">
          <div className="p-3 border-b border-[#dcdcde] bg-white">
            <p className="text-[12px] text-[#646970]">
              {dict?.["admin.customizer.customizing_desc"] ||
                `Customizing ${currentTheme.name}. Adjust styling below and see live changes in the preview pane.`}
            </p>
          </div>

          <div className="divide-y divide-[#c3c4c7]">
            {initialData.sections.map((section) => (
              <SectionPanel
                key={section.id}
                section={section}
                open={activeSection === section.id}
                onToggle={() => toggleSection(section)}
                values={customizer.values}
                defaults={customizer.defaults}
                settingsById={customizer.settingsById}
                palettes={initialData.palettes}
                onChange={customizer.setValue}
                onApplyPalette={customizer.applyPalette}
                dict={dict}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden bg-slate-400/80 p-4 sm:p-6 flex justify-center">
          <PreviewFrame themeSlug={customizer.themeSlug} lang={previewLang} state={previewState} device={device} />
        </main>
      </div>
    </div>
  );
}
