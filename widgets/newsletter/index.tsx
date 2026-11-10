"use client"
import manifest from "./widget.json"
import type {
  WidgetModule,
  WidgetManifest,
  WidgetAdminFormProps,
  WidgetRenderProps,
} from "../types"
import { NewsletterBlock } from "@/components/site/blocks/newsletter"
export function NewsletterAdminForm({
  item,
  onChange,
  dict = {},
}: WidgetAdminFormProps) {
  return (
    <div className="space-y-3">
      {["heading", "description", "buttonText"].map((key) => (
        <label className="block" key={key}>
          {
            dict[
              `admin.plugins.field.${key === "heading" ? "brandName" : key === "description" ? "pitch" : key}`
            ]
          }
          <input
            value={item.config?.[key] || ""}
            maxLength={4000}
            onChange={(e) =>
              onChange({ config: { ...item.config, [key]: e.target.value } })
            }
            className="block h-[30px] w-full border border-[#8c8f94] px-2"
          />
        </label>
      ))}
    </div>
  )
}
export function NewsletterRender({ item, theme }: WidgetRenderProps) {
  return (
    <NewsletterBlock
      compact
      source="sidebar_widget"
      theme={theme}
      title={
        item.config?.heading ||
        item.title ||
        theme?.dict?.["site.newsletter"] ||
        ""
      }
      config={{
        pitch: item.content || item.config?.description,
        buttonText: item.config?.buttonText,
      }}
    />
  )
}
export const newsletterWidgetModule: WidgetModule = {
  manifest: manifest as WidgetManifest,
  AdminForm: NewsletterAdminForm,
  render: NewsletterRender,
}
export default newsletterWidgetModule
