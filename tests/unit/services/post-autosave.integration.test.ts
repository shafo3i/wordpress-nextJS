vi.mock("server-only",()=>({}));
const principal=vi.hoisted(()=>({id:"editor-a"}));
vi.mock("@/lib/authMIddleware",()=>({verifyPostEditor:async()=>({user:{id:principal.id,role:"editor"}})}));
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { Client } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import type { DB } from "@/db"
import {
  getPostAutosave,
  savePostAutosave,
  deletePostAutosave,
} from "@/services/post-autosave.service"
import { editorSnapshot } from "../../fixtures/post-autosave"

describe.skipIf(process.env.POST_AUTOSAVE_INTEGRATION !== "1")(
  "post recovery using session-local temporary tables",
  () => {
    let client: Client, database: DB
    let version = 0
    const modified = "2026-11-09T12:00:00.000Z"
    beforeAll(async () => {
      await import("dotenv/config")
      client = new Client({ connectionString: process.env.DATABASE_URL })
      await client.connect()
      await client.query('CREATE TEMP TABLE "user" (id text PRIMARY KEY)')
      await client.query(
        "CREATE TEMP TABLE wp_usermeta (umeta_id bigserial PRIMARY KEY,user_id text NOT NULL,meta_key varchar(255),meta_value text)"
      )
      await client.query(
        'CREATE TEMP TABLE wp_posts ("ID" bigint PRIMARY KEY,post_type text NOT NULL,post_status text NOT NULL,post_modified_gmt timestamp NOT NULL,post_title text,post_content text)'
      )
      await client.query('INSERT INTO "user" VALUES ($1),($2)', [
        "editor-a",
        "editor-b",
      ])
      await client.query("INSERT INTO wp_posts VALUES (1,$1,$2,$3,$4,$5)", [
        "post",
        "publish",
        modified,
        "Live title",
        "Live content",
      ])
      database = drizzle({ client }) as unknown as DB
    }, 30000)
    afterAll(async () => {
      await client?.end()
    })
    it("saves account-private copies without touching the published post", async () => {
      const packet = {
        ownerId: "editor-a",
        documentKey: "post:1",
        expectedVersion: 0,
        baseModified: modified,
        snapshot: editorSnapshot(),
      }
      const saved = await savePostAutosave("editor-a", packet, database)
      version = saved.version
      expect(version).toBeGreaterThan(0)
      expect(
        (await getPostAutosave("editor-a", "post:1", database))?.snapshot
          .content
      ).toBe(packet.snapshot.content)
      principal.id="editor-b";
      expect(await getPostAutosave("editor-b", "post:1", database)).toBeNull();
      principal.id="editor-a";
      expect(
        (
          await client.query(
            'SELECT post_title,post_content,post_status FROM wp_posts WHERE "ID"=1'
          )
        ).rows
      ).toEqual([
        {
          post_title: "Live title",
          post_content: "Live content",
          post_status: "publish",
        },
      ])
    })
    it("rejects stale tabs and changed source posts", async () => {
      const packet = {
        ownerId: "editor-a",
        documentKey: "post:1",
        expectedVersion: 0,
        baseModified: modified,
        snapshot: editorSnapshot(),
      }
      await expect(
        savePostAutosave("editor-a", packet, database)
      ).rejects.toMatchObject({ code: "conflict" })
      await client.query(
        "UPDATE wp_posts SET post_modified_gmt=post_modified_gmt+interval '1 minute' WHERE \"ID\"=1"
      )
      await expect(
        savePostAutosave(
          "editor-a",
          { ...packet, expectedVersion: version },
          database
        )
      ).rejects.toMatchObject({ code: "post_changed" })
      await client.query(
        'UPDATE wp_posts SET post_modified_gmt=$1 WHERE "ID"=1',
        [modified]
      )
    })
    it("cleans only the acknowledged private version and leaves other accounts intact", async () => {
      principal.id="editor-b";
      await savePostAutosave(
        "editor-b",
        {
          ownerId: "editor-b",
          documentKey: "post:1",
          expectedVersion: 0,
          baseModified: modified,
          snapshot: editorSnapshot({ title: "Other editor" }),
        },
        database
      )
      principal.id="editor-a";
      await deletePostAutosave("editor-a", "post:1", 999, database)
      expect(
        await getPostAutosave("editor-a", "post:1", database)
      ).not.toBeNull()
      await deletePostAutosave("editor-a", "post:1", version, database)
      expect(await getPostAutosave("editor-a", "post:1", database)).toBeNull()
      principal.id="editor-b";
      expect(
        (await getPostAutosave("editor-b", "post:1", database))?.snapshot.title
      ).toBe("Other editor")
    })
  }
)
