import "dotenv/config"
import { Client } from "pg"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"

// Add one incomplete draft; never publish media-less episodes or overwrite edits.
// Preview: node scripts/seed-podcast-ar-episode.mjs
// Apply:   node scripts/seed-podcast-ar-episode.mjs --apply
const demo = JSON.parse(
  await readFile(
    new URL("../templates/seed/podcast-ar-episode-demo.json", import.meta.url),
    "utf8"
  )
)
const apply = process.argv.includes("--apply")
if (process.argv.slice(2).some((arg) => arg !== "--apply"))
  throw new Error("Unknown argument")
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")
const target = new URL(process.env.DATABASE_URL)
console.log({
  host: target.hostname,
  port: target.port || "5432",
  database: target.pathname.slice(1),
  apply,
})
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
})
const marker = "podcast-ar-episode-demo-v1"
try {
  await client.connect()
  await client.query("BEGIN")
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('pressforge:podcasts'))"
  )
  const show =
    await client.query(`SELECT x.term_taxonomy_id FROM wp_term_taxonomy x
    JOIN wp_terms t ON t.term_id=x.term_id
    JOIN cms_term_translations l ON l.term_taxonomy_id=x.term_taxonomy_id
    JOIN cms_languages lang ON lang.code=l.language_code AND lang.is_active=true
    JOIN wp_termmeta m ON m.term_id=t.term_id AND m.meta_key='_pressforge_demo_seed'
    WHERE x.taxonomy='podcast_show' AND t.slug='jubraka-voices-demo' AND l.language_code='ar'
    AND m.meta_value='podcast-ar-demo-v1'`)
  if (show.rowCount !== 1)
    throw new Error("The seeded Arabic show must exist exactly once")
  const existing = await client.query(
    `SELECT p."ID", m.meta_value AS seed FROM wp_posts p
    JOIN wp_term_relationships r ON r.object_id=p."ID" AND r.term_taxonomy_id=$1
    LEFT JOIN wp_postmeta m ON m.post_id=p."ID" AND m.meta_key='_pressforge_demo_seed'
    WHERE p.post_type='podcast_episode' AND p.post_name=$2`,
    [show.rows[0].term_taxonomy_id, demo.slug]
  )
  if (existing.rowCount) {
    if (existing.rowCount !== 1 || existing.rows[0].seed !== marker)
      throw new Error("Slug collision; no content changed")
    console.log({
      result: "Demo episode already exists; preserved edits",
      id: existing.rows[0].ID,
    })
    await client.query("ROLLBACK")
  } else if (!apply) {
    console.log({
      result: "Ready to create one Arabic draft, all media fields empty",
      title: demo.title,
    })
    await client.query("ROLLBACK")
  } else {
    const inserted = await client.query(
      `INSERT INTO wp_posts
      (post_type,post_status,post_title,post_name,post_excerpt,post_content,comment_status,ping_status)
      VALUES ('podcast_episode','draft',$1,$2,$3,$4,'closed','closed') RETURNING "ID"`,
      [demo.title, demo.slug, demo.summary, demo.description]
    )
    const id = inserted.rows[0].ID
    const metadata = {
      audioId: "",
      audioUrl: "",
      videoId: "",
      videoUrl: "",
      artworkId: "",
      duration: null,
      season: 1,
      episodeNumber: 1,
      transcript: demo.transcript,
      credits: demo.credits,
    }
    for (const [key, value] of [
      ["_pressforge_podcast_episode", JSON.stringify(metadata)],
      ["_pressforge_demo_seed", marker],
    ])
      await client.query(
        "INSERT INTO wp_postmeta (post_id,meta_key,meta_value) VALUES ($1,$2,$3)",
        [id, key, value]
      )
    await client.query(
      "INSERT INTO cms_post_translations (post_id,language_code,translation_group_id) VALUES ($1,'ar',$2)",
      [id, randomUUID()]
    )
    await client.query(
      "INSERT INTO wp_term_relationships (object_id,term_taxonomy_id) VALUES ($1,$2)",
      [id, show.rows[0].term_taxonomy_id]
    )
    await client.query("COMMIT")
    console.log({
      result: "Created one Arabic draft episode with empty media",
      id,
    })
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {})
  console.error(error instanceof Error ? error.message : "Seed failed")
  process.exitCode = 1
} finally {
  await client.end()
}
