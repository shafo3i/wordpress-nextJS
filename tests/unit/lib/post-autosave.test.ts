import { describe, expect, it } from "vitest"
import { editorSnapshot } from "../../fixtures/post-autosave"
import {
  autosaveDocumentKey,
  postAutosaveRequestSchema,
  AUTOSAVE_TTL_MS,
} from "@/db/schema/cms-post-autosave"
import {
  postAutosaveStorageKey,
  readLocalPostAutosave,
  localPostAutosaves,
} from "@/lib/post-autosave-storage"
import { articleShareLinks } from "@/lib/article-sharing"
import { resolveMods } from "@/lib/customizer/resolve"

describe("private post recovery", () => {
  it("scopes browser records by account and document", () => {
    expect(postAutosaveStorageKey("a", "post:1")).not.toBe(
      postAutosaveStorageKey("b", "post:1")
    )
    expect(postAutosaveStorageKey("a", "post:1")).not.toBe(
      postAutosaveStorageKey("a", "post:2")
    )
    const record = {
      documentKey: "post:1",
      snapshot: editorSnapshot(),
      baseModified: "",
      version: 1,
      savedAt: new Date().toISOString(),
    }
    expect(
      readLocalPostAutosave(JSON.stringify(record), "post:1")?.snapshot.content
    ).toContain("Private")
    expect(readLocalPostAutosave(JSON.stringify(record), "post:2")).toBeNull()
    expect(
      readLocalPostAutosave(
        JSON.stringify(record),
        "post:1",
        Date.now() + AUTOSAVE_TTL_MS + 10000
      )
    ).toBeNull()
    expect(readLocalPostAutosave("broken", "post:1")).toBeNull()
  })
  it.each([
    "post:abc",
    "post:0",
    "post:9999999999999999999",
    "new:------------------------------------",
    "other:123",
  ])("rejects invalid recovery identifiers without throwing: %s", (key) => {
    expect(autosaveDocumentKey.safeParse(key).success).toBe(false)
  })
  it("does not accept extra identity or publishing fields in a recovery request", () => {
    const packet = {
      ownerId: "a",
      documentKey: "post:1",
      expectedVersion: 0,
      baseModified: "",
      snapshot: editorSnapshot(),
    }
    expect(postAutosaveRequestSchema.safeParse(packet).success).toBe(true)
    expect(
      postAutosaveRequestSchema.safeParse({ ...packet, postAuthor: "b" })
        .success
    ).toBe(false)
    expect(
      postAutosaveRequestSchema.safeParse({
        ...packet,
        snapshot: { ...packet.snapshot, authorId: "b" },
      }).success
    ).toBe(false)
  })
  it("retains independent local copies from concurrent tabs", () => {
    const prefix = postAutosaveStorageKey("a", "post:1")
    const map = new Map([
      [
        prefix + ":tab-1",
        JSON.stringify({
          documentKey: "post:1",
          snapshot: editorSnapshot({ title: "Tab one" }),
          baseModified: "",
          version: 1,
          savedAt: "2026-11-09T12:00:00Z",
        }),
      ],
      [
        prefix + ":tab-2",
        JSON.stringify({
          documentKey: "post:1",
          snapshot: editorSnapshot({ title: "Tab two" }),
          baseModified: "",
          version: 1,
          savedAt: "2026-11-09T12:01:00Z",
        }),
      ],
    ])
    // Use fresh timestamps so this test is independent of the real calendar.
    for (const [key, raw] of map)
      map.set(
        key,
        JSON.stringify({
          ...JSON.parse(raw),
          savedAt: new Date().toISOString(),
        })
      )
    const storage = {
      length: map.size,
      key: (i: number) => [...map.keys()][i],
      getItem: (key: string) => map.get(key) || null,
    } as Storage
    expect(
      localPostAutosaves(storage, prefix, "post:1")
        .map((entry) => entry.record.snapshot.title)
        .sort()
    ).toEqual(["Tab one", "Tab two"])
  })
})

describe("article sharing", () => {
  it("encodes titles and article URLs for every configured destination", () => {
    const title = "A & B / خبر"
    const links = articleShareLinks(
      "https://site.test/en/posts/story#section",
      title
    )!
    expect(new URL(links.facebook).searchParams.get("u")).toBe(
      "https://site.test/en/posts/story"
    )
    expect(new URL(links.x).searchParams.get("text")).toBe(title)
    expect(new URL(links.whatsapp).searchParams.get("text")).toContain(title)
    expect(new URL(links.telegram).searchParams.get("url")).toBe(
      "https://site.test/en/posts/story"
    )
    expect(new URL(links.linkedin).searchParams.get("url")).toBe(
      "https://site.test/en/posts/story"
    )
    expect(new URL(links.email).searchParams.get("subject")).toBe(title)
    expect(articleShareLinks("javascript:alert(1)", title)).toBeNull()
  })
  it("persists share destination toggles through the Customizer's normal defaults", () => {
    expect(resolveMods("pressforge-broadsheet").singleShareFacebook).toBe(true)
    expect(
      resolveMods("pressforge-broadsheet", { singleShareFacebook: false })
        .singleShareFacebook
    ).toBe(false)
  })
})
