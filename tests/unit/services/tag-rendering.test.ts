import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import en from "@/templates/language/en.json";
vi.mock("next/link", () => ({ default: "a" }));
import { TagRowItem } from "@/app/(admin)/admincp/tags/_components/tag-row-item";

describe("tag output escaping", () => {
  it("renders imported HTML as text and encodes tag URL segments", () => {
    const markup = renderToStaticMarkup(createElement(TagRowItem, {
      tag: {
        id: "1", termTaxonomyId: "10", count: 0,
        name: '<img src=x onerror="alert(1)">',
        description: "<script>alert(1)</script>",
        slug: "news?injected=1#fragment",
      },
      isSelected: false, onToggleSelect: () => {},
      onQuickEdit: () => {}, onDelete: () => {}, dict: en,
    }));
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<img");
    expect(markup).toContain("&lt;script&gt;");
    expect(markup).toContain("/tag/news%3Finjected%3D1%23fragment");
    expect(markup).toContain("/admincp/posts?tag=news%3Finjected%3D1%23fragment");
  });
});
