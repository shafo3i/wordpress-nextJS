import "dotenv/config"
import { Client } from "pg"
import sharp from "sharp"
import { mkdir, readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"

// Additive and idempotent: never reset tables or replace an existing show's edits.
// Preview: node scripts/seed-podcast-ar-demo.mjs
// Apply:   node scripts/seed-podcast-ar-demo.mjs --apply
const data = JSON.parse(await readFile(new URL("../templates/seed/podcast-ar-demo.json", import.meta.url), "utf8"))
const marker = "podcast-ar-demo-v1"
const markerKey = "_pressforge_demo_seed"
const artworkUrl = "/demo/podcasts/arabic-demo-cover.png"
const artworkFile = new URL(`../public${artworkUrl}`, import.meta.url)
const apply = process.argv.includes("--apply")
if (process.argv.slice(2).some(arg => arg !== "--apply")) throw new Error("Unknown argument")
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")
const target = new URL(process.env.DATABASE_URL)
console.log({ host: target.hostname, port: target.port || "5432", database: target.pathname.slice(1), apply })
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, statement_timeout: 15000 })
try {
  await client.connect()
  await client.query("BEGIN")
  await client.query("SELECT pg_advisory_xact_lock(hashtext('pressforge:podcasts'))")
  const language = await client.query("SELECT code FROM cms_languages WHERE code = 'ar' AND is_active = true")
  if (!language.rowCount) throw new Error("Active Arabic language is required; no language records were changed")
  const existing = await client.query(`SELECT t.term_id, x.term_taxonomy_id, m.meta_value AS seed
    FROM wp_terms t LEFT JOIN wp_term_taxonomy x ON x.term_id = t.term_id
    LEFT JOIN wp_termmeta m ON m.term_id = t.term_id AND m.meta_key = $2
    WHERE t.slug = $1`, [data.slug, markerKey])
  if (existing.rowCount) {
    if (existing.rows.length !== 1 || existing.rows[0].seed !== marker) throw new Error("Slug already belongs to another record; nothing changed")
    console.log({ result: "Demo show already exists; kept existing content", ...existing.rows[0] })
    await client.query("ROLLBACK")
  } else if (!apply) {
    console.log({ result: "Ready to add exactly one Arabic show and one artwork attachment; no episodes", name: data.name })
    await client.query("ROLLBACK")
  } else {
    await mkdir(new URL("../public/demo/podcasts/", import.meta.url), { recursive: true })
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
      <rect width="1200" height="1200" fill="#102f32"/>
      <circle cx="1080" cy="90" r="430" fill="#194347"/><circle cx="70" cy="1170" r="350" fill="#194347"/>
      <rect x="58" y="58" width="1084" height="1084" rx="12" fill="none" stroke="#c4a66b" stroke-width="2"/>
      <g stroke="#d9ba7c" fill="none" stroke-width="10" stroke-linecap="round">
      <rect x="550" y="160" width="100" height="185" rx="50"/>
      <path d="M515 275v30a85 85 0 0 0 170 0v-30M600 390v65m-55 0h110"/>
      <path d="M380 240v90m-35-65v40m70-90v140m370-115v90m35-65v40m-70-90v140"/></g>
      <text x="600" y="620" text-anchor="middle" direction="rtl" font-family="Tahoma, sans-serif" font-size="112" font-weight="bold" fill="#fff9ed">أصوات جبراكة</text>
      <path d="M410 705h380" stroke="#c4a66b" stroke-width="3"/>
      <text x="600" y="805" text-anchor="middle" direction="rtl" font-family="Tahoma, sans-serif" font-size="46" fill="#e7d8b8">حكايات من السودان، بأصوات أهله</text>
      <text x="600" y="1030" text-anchor="middle" font-family="sans-serif" letter-spacing="8" font-size="30" fill="#c4a66b">JUBRAKA NEWS · PODCAST</text>
    </svg>`
    const image = await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(artworkFile))
    const attachment = await client.query(`INSERT INTO wp_posts
      (post_title, post_excerpt, post_content, post_status, post_type, post_mime_type, guid, post_name, comment_status, ping_status)
      VALUES ($1,$2,$3,'inherit','attachment','image/png',$4,$5,'closed','closed') RETURNING "ID"`,
      [data.artworkTitle, data.artworkCaption, data.artworkDescription, artworkUrl, `${data.slug}-cover`])
    const artworkId = attachment.rows[0].ID
    for (const [key, value] of Object.entries({
      _wp_attachment_image_alt: data.artworkAlt,
      _wp_attachment_metadata: JSON.stringify({ width: 1200, height: 1200, filesize: image.size, sizes: {} }),
      [markerKey]: marker,
    })) await client.query("INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES ($1,$2,$3)", [artworkId, key, value])
    const term = await client.query("INSERT INTO wp_terms (name, slug) VALUES ($1,$2) RETURNING term_id", [data.name, data.slug])
    const termId = term.rows[0].term_id
    const taxonomy = await client.query("INSERT INTO wp_term_taxonomy (term_id,taxonomy,description) VALUES ($1,'podcast_show',$2) RETURNING term_taxonomy_id", [termId, data.description])
    await client.query("INSERT INTO cms_term_translations (term_taxonomy_id,language_code,translation_group_id) VALUES ($1,'ar',$2)", [taxonomy.rows[0].term_taxonomy_id, randomUUID()])
    const config = { status: data.status, presenters: data.presenters, website: data.website, artworkId: String(artworkId) }
    for (const [key, value] of [["_pressforge_podcast_show", JSON.stringify(config)], [markerKey, marker]])
      await client.query("INSERT INTO wp_termmeta (term_id,meta_key,meta_value) VALUES ($1,$2,$3)", [termId, key, value])
    await client.query("COMMIT")
    console.log({ result: "Created one Arabic show and one artwork attachment; no episodes", termId, artworkId, artworkUrl })
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {})
  // Do not print connection strings or connection error objects containing credentials.
  console.error(error instanceof Error ? error.message : "Seed failed")
  process.exitCode = 1
} finally {
  await client.end()
}
