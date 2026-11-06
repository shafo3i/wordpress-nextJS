import "dotenv/config"
import assert from "node:assert/strict"
import { Client } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { pool, type DB } from "../db"
import { getPosts, getPostMonths } from "../services/post.service"
import {
  recordPostView,
  getPostViewCounts,
} from "../services/post-views.service"
import { VIEW_WINDOW_MS } from "../lib/post-view-token"

// Session-local tables shadow the public tables; production rows and counters are untouched.
async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  })
  await client.connect()
  try {
    for (const name of [
      "wp_posts",
      "wp_terms",
      "wp_term_taxonomy",
      "wp_term_relationships",
      "cms_post_translations",
    ])
      await client.query(
        `CREATE TEMP TABLE ${name} (LIKE public.${name} INCLUDING DEFAULTS)`
      )
    await client.query(
      `CREATE TEMP TABLE wp_postmeta(meta_id bigserial PRIMARY KEY,post_id bigint,meta_key text,meta_value text)`
    )
    await client.query(
      `CREATE TEMP TABLE rate_limit(id text PRIMARY KEY,key text UNIQUE,count int,last_request bigint)`
    )
    for (const name of ["wp_posts", "wp_postmeta", "rate_limit"]) {
      assert.equal(
        (
          await client.query(
            "SELECT relpersistence FROM pg_class WHERE oid=$1::regclass",
            [name]
          )
        ).rows[0].relpersistence,
        "t"
      )
    }
    const ids = [0, 1, 2, 3, 4].map((n) =>
      String(BigInt("9000000000000000") + BigInt(n))
    )
    const dates = [
      "2026-10-01 00:00:00",
      "2026-10-31 23:59:59",
      "2026-11-01 00:00:00",
      "2026-10-15 00:00:00",
      "2026-12-01 00:00:00",
    ]
    for (const [i, id] of ids.entries()) {
      await client.query(
        `INSERT INTO wp_posts("ID",post_title,post_name,post_date,post_date_gmt,post_type,post_status) VALUES($1,$2::text,$2::varchar,$3,$3,$4,$5)`,
        [
          id,
          `fixture-${i}`,
          dates[i],
          i === 4 ? "page" : "post",
          i === 3 ? "draft" : "publish",
        ]
      )
      await client.query(
        `INSERT INTO cms_post_translations(id,post_id,language_code,translation_group_id) VALUES($1,$2,$3,$4)`,
        [i + 1, id, i === 0 || i === 3 ? "en" : "ar", `fixture:${i}`]
      )
    }
    await client.query(
      `INSERT INTO wp_terms(term_id,name,slug) VALUES(9000000000000000,'Fixture','fixture')`
    )
    await client.query(
      `INSERT INTO wp_term_taxonomy(term_taxonomy_id,term_id,taxonomy) VALUES(9000000000000000,9000000000000000,'category')`
    )
    await client.query(
      `INSERT INTO wp_term_relationships(object_id,term_taxonomy_id) VALUES($1,9000000000000000)`,
      [ids[0]]
    )
    await client.query(
      `INSERT INTO wp_postmeta(post_id,meta_key,meta_value) VALUES($1,'post_views_count','100'),($1,'post_views_count','99'),($1,'post_views_count','invalid')`,
      [ids[0]]
    )
    const database = drizzle({ client }) as unknown as DB
    await client.query(
      `INSERT INTO wp_postmeta(post_id,meta_key,meta_value) VALUES($1,'_legatus_post_views_count','40')`,
      [ids[1]]
    )
    assert.equal((await getPostViewCounts([ids[1]], database)).get(ids[1]), 40)
    assert.deepEqual(await getPostMonths(database), ["2026-11", "2026-10"])
    assert.equal(
      (await getPosts({ date: "2026-10", status: "publish" }, database))
        .totalItems,
      2
    )
    assert.deepEqual(
      (
        await getPosts(
          { date: "range", from: "2026-10-31", to: "2026-10-31" },
          database
        )
      ).posts.map((p) => p.id),
      [ids[1]]
    )
    assert.deepEqual(
      (
        await getPosts(
          {
            date: "2026-10",
            category: "fixture",
            language: "en",
            search: "fixture-0",
          },
          database
        )
      ).posts.map((p) => p.id),
      [ids[0]]
    )
    assert.equal(
      (
        await getPosts(
          { date: "range", from: "2026-11-02", to: "2026-11-01" },
          database
        )
      ).totalItems,
      0
    )
    assert.equal((await getPosts({ date: "2026-99" }, database)).totalItems, 0)
    assert.equal((await getPostViewCounts([ids[0]], database)).get(ids[0]), 100)
    const now = Date.now(),
      id = BigInt(ids[0]),
      request = "b".repeat(64)
    assert.deepEqual(
      await recordPostView(id, "a".repeat(64), request, database, now),
      { views: 101, counted: true }
    )
    assert.deepEqual(
      await recordPostView(id, "a".repeat(64), request, database, now + 1000),
      { views: 101, counted: false }
    )
    assert.deepEqual(
      await recordPostView(id, "c".repeat(64), request, database, now + 1001),
      { views: 102, counted: true }
    )
    assert.deepEqual(
      await recordPostView(
        id,
        "a".repeat(64),
        request,
        database,
        now + VIEW_WINDOW_MS + 1
      ),
      { views: 103, counted: true }
    )
    assert.equal(
      await recordPostView(BigInt(ids[3]), "a".repeat(64), request, database),
      null
    )
    assert.equal(
      await recordPostView(BigInt(ids[4]), "a".repeat(64), request, database),
      null
    )
    assert.equal(
      (await getPosts({ orderBy: "viewCount", order: "desc" }, database))
        .posts[0].viewCount,
      103
    )
    await client.query(
      `UPDATE rate_limit SET count=60,last_request=$1 WHERE key=$2`,
      [now, `post-view:request:${request}`]
    )
    assert.deepEqual(
      await recordPostView(id, "d".repeat(64), request, database, now + 1),
      { views: 103, counted: false }
    )
    console.log(
      "Temporary-table integration passed: month/range boundaries, combined filters, historical totals, duplicate reloads, expiry, rate limits, sorting and unpublished exclusions"
    )
  } finally {
    await client.end()
  }
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Integration failed")
    process.exitCode = 1
  })
  .finally(() => pool.end())
