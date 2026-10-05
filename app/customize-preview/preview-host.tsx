"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import type { ContentItem } from "@/lib/site-content";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { HomepageSettings } from "@/lib/themes/homepage-types";
import type { WidgetItem } from "@/widgets/types";
import { getFontKind } from "@/lib/customizer/fonts";
import { resolveColor } from "@/lib/customizer/resolve";
import type { CustomizerToPreview, PreviewState, PreviewToCustomizer } from "@/lib/customizer/preview-protocol";
import { getThemeModule } from "@/themes/registry";
import { NewsHome } from "@/components/site/templates/news-home";
import { PostTemplate } from "@/components/site/templates/post-template";

interface PreviewHostProps {
  themeSlug: string;
  /** Locale aware context from the server (dictionary, direction, menus, plugins). */
  baseTheme: FrontEndThemeContext;
  initialState: PreviewState;
  posts: ContentItem[];
  homepageSettings: HomepageSettings;
  primarySidebar: WidgetItem[];
  secondarySidebar: WidgetItem[];
  footerWidgets: { col1: WidgetItem[]; col2: WidgetItem[]; col3: WidgetItem[] };
}

/** Lives inside the customizer iframe: renders the real templates and applies state posted by the editor. */
export function PreviewHost({
  themeSlug,
  baseTheme,
  initialState,
  posts,
  homepageSettings,
  primarySidebar,
  secondarySidebar,
  footerWidgets,
}: PreviewHostProps) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const onMessage = (event: MessageEvent<CustomizerToPreview>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === "customizer:state") setState(event.data.state);
    };
    window.addEventListener("message", onMessage);

    const ready: PreviewToCustomizer = { type: "customizer:ready" };
    window.parent.postMessage(ready, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const { mods } = state;
  const theme: FrontEndThemeContext = {
    ...baseTheme,
    themeSlug,
    siteTitle: state.siteTitle,
    siteTagline: state.siteTagline,
    primaryColor: resolveColor(mods, "primaryColor"),
    headerLayout: mods.headerLayout ?? "classic",
    headingFont: getFontKind(mods.headingFontFamily),
    sectionStyle: getThemeModule(themeSlug).supports?.sectionStyle ?? "minimal",
    darkMode: Boolean(mods.darkMode),
    footerCopyright: mods.footerCopyright || "",
    mods,
  };

  const [lead, ...rest] = posts;

  const blockNavigation = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) event.preventDefault();
  };
  const blockSubmit = (event: FormEvent) => event.preventDefault();

  return (
    <div onClickCapture={blockNavigation} onSubmitCapture={blockSubmit}>
      {state.page === "home" || !lead ? (
        <NewsHome
          posts={posts}
          theme={theme}
          settings={homepageSettings}
          primarySidebar={primarySidebar}
          secondarySidebar={secondarySidebar}
          footerWidgets={footerWidgets}
        />
      ) : (
        <PostTemplate
          article={lead}
          relatedPosts={rest.slice(0, 3)}
          theme={theme}
          sidebarWidgets={primarySidebar}
          footerWidgets={footerWidgets}
        />
      )}
    </div>
  );
}