import { describe, expect, it } from "vitest"
import { contentPlainText } from "@/lib/content-text"

describe("WordPress excerpt text", () => {
  it("decodes named, numeric and doubly escaped entities", () => {
    expect(
      contentPlainText("Hello&nbsp;world &lt;24h&gt; &#160; &amp;nbsp;")
    ).toBe("Hello world <24h>")
  })
  it("separates paragraphs and removes scripts, HTML and caption shortcodes", () => {
    expect(
      contentPlainText(
        "[caption]<p>First</p><p>Second</p>[/caption]<script>bad()</script>"
      )
    ).toBe("First Second")
  })
  it("preserves Arabic text and normalized whitespace", () => {
    expect(contentPlainText("<p>أخبار&nbsp; السودان</p>")).toBe("أخبار السودان")
  })
})
