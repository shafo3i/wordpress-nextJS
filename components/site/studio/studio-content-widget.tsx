import { CompactPostsBlock } from "@/components/site/blocks/compact-posts"
import { useQuery } from "@tanstack/react-query"
import { renderEditorialBlock } from "@/components/site/blocks/registry"
import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer"
import {
  getStudioBlockTitle,
  getStudioElementContentRequest,
  studioContentRequestKey,
  type StudioContentResult,
} from "@/lib/studio/content"
import { studioContentQueryOptions } from "@/lib/studio/content-query"
import { sanitizeStudioWidgetConfig } from "@/lib/studio/sanitize"
import type { StudioWidgetProps } from "./studio-widget-types"
import type { WidgetItem } from "@/widgets/types"

function ResolvedContent({
  result,
  ...props
}: StudioWidgetProps & { result?: StudioContentResult }) {
  const { element, theme, isEditor, liveContent, dict, pageLocale } = props
  const messages = liveContent ? dict : theme.dict
  if (!result) return null
  const block = element.settings.blockConfig
  if (block) {
    const title = getStudioBlockTitle(
      block,
      result.locale,
      pageLocale || theme.defaultLocale || result.locale
    )
    if (!result.items.length)
      return (
        <section
          dir={result.direction}
          lang={result.locale}
          className="space-y-2"
        >
          <h2>{title}</h2>
          <p role="status" className="text-xs text-theme-muted">
            {messages?.[
              result.categoryMissing
                ? "admin.studio.content.category_missing"
                : "admin.studio.content.empty"
            ] || ""}
          </p>
        </section>
      )
    const localizedBlock = {
      ...block,
      title,
      titles: { ...block.titles, [result.locale]: title },
      subtitle:
        block.subtitles?.[result.locale] ??
        (result.locale === (pageLocale || theme.defaultLocale)
          ? block.subtitle
          : ""),
      subtitles: {
        ...block.subtitles,
        [result.locale]:
          block.subtitles?.[result.locale] ??
          (result.locale === (pageLocale || theme.defaultLocale)
            ? block.subtitle || ""
            : ""),
      },
    }
    return (
      <div dir={result.direction} lang={result.locale}>
        {renderEditorialBlock({
          block: localizedBlock,
          posts: result.items,
          theme: {
            ...theme,
            locale: result.locale,
            direction: result.direction,
            isDefaultLocale: result.locale === theme.defaultLocale,
          },
          preFiltered: true,
          design: element.settings.design,
        })}
      </div>
    )
  }
  const settings = element.settings
  const locale = props.contentLocale || theme.locale || theme.defaultLocale
  if (
    !isEditor &&
    settings.widgetLocale &&
    settings.widgetLocale !== "all" &&
    settings.widgetLocale !== locale
  )
    return null
  if (!settings.widgetId) return null
  const config = sanitizeStudioWidgetConfig(settings.widgetConfig)
  if (
    settings.widgetId === "recent_posts" &&
    (!config.displayStyle ||
      ["list", "compact"].includes(String(config.displayStyle)))
  )
    return (
      <div dir={result.direction} lang={result.locale}>
        <CompactPostsBlock
          posts={result.items}
          design={settings.design}
          theme={{
            ...theme,
            locale: result.locale,
            direction: result.direction,
          }}
          block={{
            id: element.id,
            type: "recent_posts",
            title: settings.widgetTitle || "",
            enabled: true,
            order: 0,
            imageRatio: config.showThumbnail === false ? "none" : "square",
            showDate: config.showDate !== false,
            showExcerpt: Boolean(config.showExcerpt),
            showCategory: false,
          }}
        />
      </div>
    )
  const item: WidgetItem = {
    id: element.id,
    type: settings.widgetId,
    title: settings.widgetTitle || "",
    content: typeof config.content === "string" ? config.content : undefined,
    count: result.pageSize,
    config,
    displayStyle: config.displayStyle as WidgetItem["displayStyle"],
    locale: settings.widgetLocale,
  }
  return (
    <SidebarWidgetRenderer
      item={item}
      posts={result.items}
      theme={{ ...theme, locale: result.locale, direction: result.direction }}
    />
  )
}

function LiveContent(props: StudioWidgetProps) {
  const locale =
    props.contentLocale || props.theme.locale || props.theme.defaultLocale || ""
  const request = getStudioElementContentRequest(props.element, locale)!
  const query = useQuery({
    ...studioContentQueryOptions(request),
    initialData:
      props.widgetContent?.requests[studioContentRequestKey(request)],
  })
  if (query.isPending)
    return (
      <p role="status" className="text-xs text-theme-muted">
        {props.dict?.["admin.studio.content.loading"] || ""}
      </p>
    )
  if (query.isError)
    return (
      <div role="alert" className="text-xs text-theme-muted">
        <p>{props.dict?.["admin.studio.content.error"] || ""}</p>
        <button type="button" onClick={() => void query.refetch()}>
          {props.dict?.["admin.studio.content.retry"] || ""}
        </button>
      </div>
    )
  return <ResolvedContent {...props} result={query.data} />
}

export function StudioContentWidget(props: StudioWidgetProps) {
  if (props.liveContent) return <LiveContent {...props} />
  const request = getStudioElementContentRequest(
    props.element,
    props.contentLocale || props.theme.locale || props.theme.defaultLocale || ""
  )
  if (
    request &&
    props.widgetContent?.errors?.[studioContentRequestKey(request)]
  )
    return (
      <p role="status" className="text-xs text-theme-muted">
        {props.theme.dict?.["admin.studio.content.error"] || ""}
      </p>
    )
  return (
    <ResolvedContent
      {...props}
      result={
        request
          ? props.widgetContent?.requests[studioContentRequestKey(request)]
          : undefined
      }
    />
  )
}
