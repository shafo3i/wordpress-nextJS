"use client";

import React from "react";
import type { PageBuilderSection } from "@/lib/themes/homepage-types";
import { getColumnSpanClass } from "@/lib/themes/homepage-types";
import type { FrontEndThemeContext } from "@/lib/site-theme";
import type { ContentItem } from "@/lib/site-content";
import { BuilderItemRenderer } from "./builder-item-renderer";

interface BuilderSectionRendererProps {
  section: PageBuilderSection;
  posts: ContentItem[];
  theme: FrontEndThemeContext;
}

export function BuilderSectionRenderer({
  section,
  posts,
  theme,
}: BuilderSectionRendererProps) {
  const containerClass =
    section.container === "full"
      ? "w-full px-4 sm:px-6 lg:px-8"
      : "theme-container mx-auto px-4 sm:px-6 lg:px-8";

  const paddingClass =
    section.paddingY === "none"
      ? "py-0"
      : section.paddingY === "sm"
      ? "py-4"
      : section.paddingY === "lg"
      ? "py-12"
      : "py-6";

  return (
    <section
      key={section.id}
      style={section.backgroundColor ? { backgroundColor: section.backgroundColor } : undefined}
      className={`${paddingClass} transition-colors`}
    >
      <div className={containerClass}>
        {section.title && (
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-theme-heading">
              {section.title}
            </h2>
          </div>
        )}

        <div className="space-y-8">
          {section.rows.map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-6 items-start">
              {row.columns.map((column) => {
                const spanClass = getColumnSpanClass(column.width);
                return (
                  <div key={column.id} className={`${spanClass} space-y-6 w-full`}>
                    {column.items.map((item) => (
                      <BuilderItemRenderer
                        key={item.id}
                        item={item}
                        posts={posts}
                        theme={theme}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
