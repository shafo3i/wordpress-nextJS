vi.mock("server-only", () => ({}))
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { Client } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import type { DB } from "@/db"
import {
  addNewsletterSubscriber,
  confirmNewsletterSubscriber,
  unsubscribeNewsletterSubscriber,
  newsletterRequestAllowed,
  getNewsletterSubscribers,
} from "@/lib/newsletter/db"
import {
  getFactReview,
  saveFactReview,
  publicFactReview,
} from "@/services/fact-review.service"
import {
  togglePlugin,
  bulkUpdatePlugins,
  getActivePluginSlugs,
  getInstalledPluginSlugs,
} from "@/services/plugin.service"
import { getRelatedPublishedPostIds } from "@/services/related-posts.service"

describe.skipIf(process.env.PLUGIN_INTEGRATION !== "1")(
  "plugin persistence in connection-local temporary tables",
  () => {
    let client: Client, database: DB
    beforeAll(async () => {
      await import("dotenv/config")
      client = new Client({ connectionString: process.env.DATABASE_URL })
      await client.connect()
      // All writes use these shadow tables. No real posts, options or subscriber rows are changed.
      await client.query(
        "CREATE TEMP TABLE wp_posts (LIKE public.wp_posts INCLUDING DEFAULTS)"
      )
      await client.query(
        "CREATE TEMP TABLE wp_postmeta (meta_id bigserial PRIMARY KEY,post_id bigint NOT NULL,meta_key varchar(255),meta_value text)"
      )
      await client.query(
        "CREATE TEMP TABLE wp_options (option_id bigserial PRIMARY KEY,option_name varchar(191) UNIQUE NOT NULL,option_value text NOT NULL,autoload varchar(20))"
      )
      await client.query(
        "CREATE TEMP TABLE cms_newsletter_subscribers(email text PRIMARY KEY,id text UNIQUE NOT NULL,name text,source text,locale text,status text NOT NULL,subscribed_at timestamp NOT NULL DEFAULT now(),confirmation_hash text,confirmation_expires timestamp,next_request_at timestamp)"
      )
      await client.query(
        "CREATE TEMP TABLE cms_newsletter_rate_limits(key text PRIMARY KEY,count integer NOT NULL,resets_at timestamp NOT NULL)"
      )
      await client.query(
        "CREATE TEMP TABLE cms_post_translations(post_id bigint,language_code text)"
      )
      await client.query(
        "CREATE TEMP TABLE cms_languages(code text,is_active boolean)"
      )
      await client.query(
        "CREATE TEMP TABLE wp_term_relationships(object_id bigint,term_taxonomy_id bigint)"
      )
      await client.query(
        "CREATE TEMP TABLE wp_term_taxonomy(term_taxonomy_id bigint,taxonomy text)"
      )
      await client.query(
        "INSERT INTO wp_posts (\"ID\",post_title,post_content,post_excerpt,post_type,post_status) VALUES(1,'Claim','Original article','Excerpt','post','publish')"
      )
      database = drizzle({ client }) as unknown as DB
    }, 30000)
    afterAll(async () => {
      await client?.end()
    })
    it("upserts concurrent subscriptions without losing readers and confirms once", async () => {
      const results = await Promise.all(
        Array.from({ length: 8 }, () =>
          addNewsletterSubscriber(
            "reader@example.org",
            { locale: "ar" },
            database
          )
        )
      )
      const sent = results.filter((r) => r.confirmationToken)
      expect(sent).toHaveLength(1)
      await addNewsletterSubscriber(
        "second@example.org",
        { locale: "en" },
        database
      )
      expect(await getNewsletterSubscribers(database)).toHaveLength(2)
      const before = await client.query(
        "SELECT status,confirmation_hash FROM cms_newsletter_subscribers WHERE email='reader@example.org'"
      )
      expect(before.rows[0].status).toBe("pending")
      expect(before.rows[0].confirmation_hash).not.toBe(
        sent[0].confirmationToken
      )
      const active = await confirmNewsletterSubscriber(
        sent[0].confirmationToken!,
        database
      )
      expect(active?.status).toBe("active")
      expect(
        await confirmNewsletterSubscriber(sent[0].confirmationToken!, database)
      ).toBeNull()
      expect(
        (await addNewsletterSubscriber("reader@example.org", {}, database))
          .confirmationToken
      ).toBeNull()
      await unsubscribeNewsletterSubscriber(active!.id, database)
      expect(
        (await getNewsletterSubscribers(database)).find(
          (r) => r.id === active!.id
        )?.status
      ).toBe("unsubscribed")
    })
    it("expires confirmation tokens and enforces the shared rate limit", async () => {
      const result = await addNewsletterSubscriber(
        "expired@example.org",
        {},
        database
      )
      await client.query(
        "UPDATE cms_newsletter_subscribers SET confirmation_expires=now()-interval '1 minute' WHERE email='expired@example.org'"
      )
      expect(
        await confirmNewsletterSubscriber(result.confirmationToken!, database)
      ).toBeNull()
      for (let i = 0; i < 60; i++)
        expect(await newsletterRequestAllowed(database)).toBe(true)
      expect(await newsletterRequestAllowed(database)).toBe(false)
    })
    it("preserves review history, rejects stale writers and hides approval after edits", async () => {
      const initial = await getFactReview("1", database)
      const input = {
        postId: "1",
        expectedVersion: 0,
        sourceHash: initial.sourceHash,
        claim: "Specific claim",
        summary: "Evidence explanation",
        sources: ["https://example.org/evidence"],
        status: "supported" as const,
        approve: true,
      }
      await saveFactReview(
        input,
        { id: "reviewer", name: "Reviewer" },
        database
      )
      expect(
        publicFactReview(await getFactReview("1", database))?.reviewerId
      ).toBe("reviewer")
      await expect(
        saveFactReview(input, { id: "other", name: "Other" }, database)
      ).rejects.toThrow("conflict")
      await client.query(
        "UPDATE wp_posts SET post_content='Changed article' WHERE \"ID\"=1"
      )
      expect(publicFactReview(await getFactReview("1", database))).toBeNull()
      await expect(
        saveFactReview(
          { ...input, expectedVersion: 1 },
          { id: "reviewer", name: "Reviewer" },
          database
        )
      ).rejects.toThrow("source_changed")
      const latest = await getFactReview("1", database)
      await saveFactReview(
        {
          ...input,
          expectedVersion: 1,
          sourceHash: latest.sourceHash,
          status: "in_review",
          approve: false,
        },
        { id: "reviewer", name: "Reviewer" },
        database
      )
      expect((await getFactReview("1", database)).history).toHaveLength(2)
      const rows = await client.query(
        'SELECT post_content,post_status FROM wp_posts WHERE "ID"=1'
      )
      expect(rows.rows[0]).toEqual({
        post_content: "Changed article",
        post_status: "publish",
      })
    })
    it("keeps installed and active plugin state consistent and blocks retired plugins", async () => {
      await togglePlugin("fact-check", true, database)
      expect(await getActivePluginSlugs(database)).toContain("fact-check")
      expect(await getInstalledPluginSlugs(database)).toContain("fact-check")
      await bulkUpdatePlugins(["table-of-contents"], "activate", database)
      expect(await getInstalledPluginSlugs(database)).toContain(
        "table-of-contents"
      )
      await bulkUpdatePlugins(["fact-check"], "delete", database)
      expect(await getActivePluginSlugs(database)).not.toContain("fact-check")
      await expect(
        togglePlugin("social-share", true, database)
      ).rejects.toThrow("retired")
    })
    it("finds old category/tag matches outside the newest ten and excludes private, future and other-language posts", async () => {
      await client.query(
        "INSERT INTO cms_languages VALUES ('ar',true),('en',true)"
      )
      await client.query(
        "INSERT INTO wp_posts (\"ID\",post_title,post_type,post_status,post_date_gmt) SELECT n,'Story '||n,'post','publish',now()-(30-n)*interval '1 day' FROM generate_series(2,29) n"
      )
      await client.query(
        "INSERT INTO cms_post_translations SELECT \"ID\",CASE WHEN \"ID\"=29 THEN 'en' ELSE 'ar' END FROM wp_posts"
      )
      await client.query(
        "INSERT INTO wp_term_taxonomy VALUES (1,'category'),(2,'post_tag')"
      )
      await client.query(
        "INSERT INTO wp_term_relationships VALUES (1,1),(2,1),(26,1),(27,1),(28,1),(29,1),(1,2),(3,2)"
      )
      await client.query(
        "UPDATE wp_posts SET post_password='protected' WHERE \"ID\"=26"
      )
      await client.query(
        "UPDATE wp_posts SET post_status='draft' WHERE \"ID\"=27"
      )
      await client.query(
        "UPDATE wp_posts SET post_date_gmt=now()+interval '1 day' WHERE \"ID\"=28"
      )
      const category = await getRelatedPublishedPostIds(
        "1",
        3,
        "categories",
        "ar",
        database
      )
      expect(category.map(String)).toEqual(["2", "25", "24"])
      expect(
        (await getRelatedPublishedPostIds("1", 2, "tags", "ar", database)).map(
          String
        )
      ).toEqual(["3", "25"])
      expect(
        (
          await getRelatedPublishedPostIds("1", 2, "recent", "ar", database)
        ).map(String)
      ).toEqual(["25", "24"])
    })
  }
)
