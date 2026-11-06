import "dotenv/config"
import { Client } from "pg"
import { hashPassword } from "better-auth/crypto"
import { createHash, randomBytes, randomUUID } from "node:crypto"
import { readFile, writeFile, mkdir, access } from "node:fs/promises"
import { resolve, sep } from "node:path"
import seed from "../../templates/seed/studio-bilingual.json"
import { homepageDocument } from "./homepages"
import { importArticleHtml, rewriteWordPressUrl } from "./content"

type Row = Record<string, string | number | boolean | Date | null | undefined>
type SourceRow = Record<string, string>
const out = resolve(".local/wordpress-migration")
const args = process.argv.slice(2)
const argument = (key: string) =>
  args.includes(key) ? args[args.indexOf(key) + 1] : undefined
const quote = (key: string) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key))
    throw new Error("Invalid SQL identifier")
  return `"${key}"`
}
const clean = (v: unknown) =>
  typeof v === "string" ? v.replaceAll("\0", "") : (v ?? null)
const exists = async (path: string) =>
  access(path).then(
    () => true,
    () => false
  )

async function main() {
  const input = await readFile(resolve(out, "prepared.json"))
  const data = JSON.parse(input.toString("utf8")) as {
    posts: SourceRow[]
    users: SourceRow[]
    terms: SourceRow[]
    taxonomies: SourceRow[]
    comments: SourceRow[]
    relationships: Record<string, string[]>
    metadata: Record<string, Record<string, string[]>>
    options: Record<string, string>
  }
  const fingerprint = createHash("sha256").update(input).digest("hex")
  const target = new URL(process.env.DATABASE_URL || "")
  const database = decodeURIComponent(target.pathname.slice(1))
  const email = argument("--admin-email")
  console.log(
    JSON.stringify({
      apply: args.includes("--apply"),
      target: { host: target.hostname, database },
      articles: data.posts.filter((p) => p.post_type === "post").length,
      attachments: data.posts.filter((p) => p.post_type === "attachment")
        .length,
      homepages: 2,
      demoArticles: 0,
    })
  )
  if (!args.includes("--apply")) return
  if (
    argument("--expect-host") !== target.hostname ||
    argument("--expect-database") !== database ||
    !email?.includes("@")
  )
    throw new Error(
      "Explicit target host, database and admin email are required"
    )
  const converted = JSON.parse(
    await readFile(resolve(out, "converted.json"), "utf8")
  ) as {
    sha256: string
    entries: Record<string, { content: string; excerpt: string }>
  }
  if (
    converted.sha256 !== fingerprint ||
    data.posts.some((p) => !converted.entries[p.ID])
  ) {
    throw new Error("Run convert.ts for this source snapshot before importing")
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    application_name: "pressforge-wordpress-import",
  })
  await client.connect()
  async function insert(table: string, rows: Row[]) {
    if (!rows.length) return
    const keys = Object.keys(rows[0])
    for (let offset = 0; offset < rows.length; offset += 250) {
      const chunk = rows.slice(offset, offset + 250)
      await client.query(
        `INSERT INTO ${quote(table)} (${keys.map(quote).join(",")}) VALUES ${chunk.map((_, i) => `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(",")})`).join(",")}`,
        chunk.flatMap((row) => keys.map((key) => clean(row[key])))
      )
    }
  }
  try {
    await client.query("BEGIN")
    await client.query("SELECT pg_advisory_xact_lock(17293645)")
    const marker = await client.query(
      "SELECT option_value FROM wp_options WHERE option_name='wordpress_migration_version'"
    )
    if (marker.rows[0]?.option_value === fingerprint) {
      await client.query("ROLLBACK")
      console.log(
        "This source snapshot was already imported; existing data left intact."
      )
      return
    }
    for (const table of [
      "wp_posts",
      "wp_terms",
      "user",
      "wp_options",
      "cms_languages",
    ]) {
      if (
        (await client.query(`SELECT 1 FROM ${quote(table)} LIMIT 1`)).rowCount
      )
        throw new Error(`Refusing import: ${table} is not empty`)
    }
    await mkdir(out, { recursive: true })
    const credentialPath = resolve(out, "admin-credentials.json")
    let credentials: { email: string; password: string }
    if (await exists(credentialPath)) {
      credentials = JSON.parse(await readFile(credentialPath, "utf8"))
      if (credentials.email !== email)
        throw new Error(
          "Saved administrator credentials belong to a different email"
        )
    } else {
      credentials = { email, password: randomBytes(24).toString("base64url") }
      await writeFile(credentialPath, JSON.stringify(credentials, null, 2), {
        mode: 0o600,
        flag: "wx",
      })
    }
    const adminId = randomUUID()
    await insert("user", [
      {
        id: adminId,
        name: email.split("@")[0],
        email,
        email_verified: true,
        role: "admin",
      },
    ])
    await insert("account", [
      {
        id: randomUUID(),
        account_id: adminId,
        provider_id: "credential",
        user_id: adminId,
        password: await hashPassword(credentials.password),
        updated_at: new Date(),
      },
    ])
    const authors = new Map<string, string>()
    const emails = new Map([[email.toLowerCase(), adminId]])
    for (const author of data.users) {
      const sourceId = String(author.ID)
      const sourceEmail = String(
        author.user_email || `wordpress-author-${sourceId}@migration.invalid`
      ).toLowerCase()
      let id = emails.get(sourceEmail)
      if (!id) {
        id = randomUUID()
        emails.set(sourceEmail, id)
        // Historic authors keep attribution but have no credential account.
        await insert("user", [
          {
            id,
            name: author.display_name || author.user_login,
            email: sourceEmail,
            email_verified: false,
            role: "author",
          },
        ])
      }
      authors.set(sourceId, id)
    }
    for (const [index, locale] of (["en", "ar"] as const).entries()) {
      const language = seed.locales[locale]
      await insert("cms_languages", [
        {
          code: locale,
          name: language.name,
          native_name: language.nativeName,
          direction: language.direction,
          is_default: locale === "en",
          is_active: true,
          display_order: index,
        },
      ])
      const dict = JSON.parse(
        await readFile(resolve(`templates/language/${locale}.json`), "utf8")
      )
      await insert(
        "cms_translations",
        Object.entries(dict)
          .filter(([, value]) => typeof value === "string")
          .map(([key, value]) => ({
            language_code: locale,
            key,
            value: String(value),
          }))
      )
    }
    const ids = new Set(data.posts.map((p) => String(p.ID)))
    const articleSlugs = new Set<string>(
      data.posts.filter((p) => p.post_type === "post").map((p) => p.post_name)
    )
    const articleIds = new Map<string, string>(
      data.posts
        .filter((p) => p.post_type === "post")
        .map((p) => [String(p.ID), p.post_name])
    )
    const rewrite = (url: string) =>
      rewriteWordPressUrl(url, articleSlugs, articleIds)
    const postColumns = [
      "ID",
      "post_author",
      "post_date",
      "post_date_gmt",
      "post_content",
      "post_title",
      "post_excerpt",
      "post_status",
      "comment_status",
      "ping_status",
      "post_password",
      "post_name",
      "to_ping",
      "pinged",
      "post_modified",
      "post_modified_gmt",
      "post_content_filtered",
      "post_parent",
      "guid",
      "menu_order",
      "post_type",
      "post_mime_type",
      "comment_count",
    ]
    const posts: Row[] = [],
      missingFiles: string[] = [],
      excludedHtmlAttachments: string[] = []
    for (const p of data.posts) {
      const id = String(p.ID),
        meta = (data.metadata[id] ||= {})
      const content = converted.entries[id].content
      if (content !== p.post_content)
        meta._wordpress_original_content = [p.post_content || ""]
      p.post_content = content
      p.post_excerpt = converted.entries[id].excerpt
      p.post_author = authors.get(String(p.post_author)) || adminId
      if (
        p.post_parent &&
        p.post_parent !== "0" &&
        !ids.has(String(p.post_parent))
      ) {
        meta._wordpress_original_parent = [String(p.post_parent)]
        p.post_parent = "0"
      }
      if (p.post_type === "attachment" && p._media_path) {
        const root = resolve("public/uploads"),
          file = resolve(root, p._media_path)
        if (!file.startsWith(root + sep))
          throw new Error("Unsafe attachment path")
        if (await exists(file)) p.guid = "/uploads/" + p._media_path
        else if (p.post_mime_type === "text/html")
          excludedHtmlAttachments.push(id)
        else missingFiles.push(id)
        try {
          const parsed = JSON.parse(meta._wp_attachment_metadata?.[0] || "{}")
          if (!parsed || typeof parsed !== "object")
            throw new Error("Invalid metadata")
        } catch {
          meta._wordpress_original_attachment_metadata =
            meta._wp_attachment_metadata || []
          meta._wp_attachment_metadata = [
            JSON.stringify({ file: p._media_path, sizes: {} }),
          ]
        }
      }
      posts.push(
        Object.fromEntries(
          postColumns.map((key) => [
            key,
            p[key] ??
              (["post_parent", "menu_order", "comment_count"].includes(key)
                ? 0
                : ""),
          ])
        )
      )
      if (posts.length % 1000 === 0)
        console.log(JSON.stringify({ preparedPosts: posts.length }))
    }
    await insert("wp_posts", posts)
    console.log("Article and attachment records inserted")
    await insert(
      "cms_post_translations",
      posts.map((p) => ({
        post_id: p.ID,
        language_code: "ar",
        translation_group_id: `wordpress:post:${p.ID}`,
      }))
    )
    await insert(
      "wp_terms",
      data.terms.map((t) => ({
        term_id: t.term_id,
        name: t.name,
        slug: t.slug,
        term_group: t.term_group || 0,
      }))
    )
    await insert(
      "wp_term_taxonomy",
      data.taxonomies.map((t) => ({
        term_taxonomy_id: t.term_taxonomy_id,
        term_id: t.term_id,
        taxonomy: t.taxonomy,
        description: t.description || "",
        parent: t.parent || 0,
        count: 0,
      }))
    )
    await insert(
      "cms_term_translations",
      data.taxonomies.map((t) => ({
        term_taxonomy_id: t.term_taxonomy_id,
        language_code: "ar",
        translation_group_id: `wordpress:term:${t.term_taxonomy_id}`,
      }))
    )
    await insert(
      "wp_term_relationships",
      Object.entries(data.relationships).flatMap(([id, terms]) =>
        terms.map((tid) => ({
          object_id: id,
          term_taxonomy_id: tid,
          term_order: 0,
        }))
      )
    )
    await insert(
      "wp_postmeta",
      Object.entries(data.metadata).flatMap(([id, keys]) =>
        Object.entries(keys).flatMap(([key, values]) =>
          values.map((value) => ({
            post_id: id,
            meta_key: key,
            meta_value: value,
          }))
        )
      )
    )
    const commentIds = new Set(data.comments.map((c) => String(c.comment_ID)))
    await insert(
      "wp_comments",
      data.comments.map((c) => ({
        comment_ID: c.comment_ID,
        comment_post_ID: c.comment_post_ID,
        comment_author: c.comment_author || "",
        comment_author_email: c.comment_author_email || "",
        comment_author_url: c.comment_author_url || "",
        comment_author_IP: c.comment_author_IP || "",
        comment_date: c.comment_date || "1970-01-01 00:00:00",
        comment_date_gmt:
          c.comment_date_gmt || c.comment_date || "1970-01-01 00:00:00",
        comment_content: importArticleHtml(c.comment_content || "", rewrite),
        comment_karma: c.comment_karma || 0,
        comment_approved: c.comment_approved || "0",
        comment_agent: c.comment_agent || "",
        comment_type: c.comment_type || "comment",
        comment_parent: commentIds.has(String(c.comment_parent))
          ? c.comment_parent
          : 0,
        user_id: authors.get(String(c.user_id)) || null,
      }))
    )
    let nextPost = Math.max(...posts.map((p) => Number(p.ID))) + 1
    let nextTerm = Math.max(...data.terms.map((t) => Number(t.term_id))) + 1
    let nextTax =
      Math.max(...data.taxonomies.map((t) => Number(t.term_taxonomy_id))) + 1
    const categories = data.taxonomies
      .filter((t) => t.taxonomy === "category")
      .sort((a, b) => {
        const count = (id: string) =>
          Object.values(data.relationships).filter((ts) => ts.includes(id))
            .length
        return count(b.term_taxonomy_id) - count(a.term_taxonomy_id)
      })
      .map((t) => ({
        id: String(t.term_taxonomy_id),
        slug: data.terms.find((term) => term.term_id === t.term_id)!.slug,
      }))
    const pages: Record<string, string> = {},
      locations: Record<string, string> = {}
    for (const locale of ["en", "ar"] as const) {
      const id = String(nextPost++),
        title = seed.locales[locale].home
      pages[locale] = id
      await insert("wp_posts", [
        {
          ID: id,
          post_author: adminId,
          post_title: title,
          post_name: `home-${locale}`,
          post_type: "page",
          post_status: "publish",
          post_content: "",
          guid: locale === "en" ? "/" : "/ar",
        },
      ])
      await insert("cms_post_translations", [
        {
          post_id: id,
          language_code: locale,
          translation_group_id: "wordpress:page:home",
        },
      ])
      await insert("wp_postmeta", [
        { post_id: id, meta_key: "_studio_edit_mode", meta_value: "builder" },
        {
          post_id: id,
          meta_key: "_studio_data",
          meta_value: JSON.stringify(
            homepageDocument(locale, locale === "ar" ? categories : [])
          ),
        },
        {
          post_id: id,
          meta_key: "_wp_page_template",
          meta_value: "studio_full_width",
        },
      ])
      const term = String(nextTerm++),
        taxonomy = String(nextTax++),
        menu = String(nextPost++)
      await insert("wp_terms", [
        { term_id: term, name: title, slug: `primary-${locale}` },
      ])
      await insert("wp_term_taxonomy", [
        { term_taxonomy_id: taxonomy, term_id: term, taxonomy: "nav_menu" },
      ])
      await insert("wp_termmeta", [
        { term_id: term, meta_key: "language", meta_value: locale },
      ])
      locations[`primary_${locale}`] = taxonomy
      locations[`footer_${locale}`] = taxonomy
      await insert("wp_posts", [
        {
          ID: menu,
          post_author: adminId,
          post_title: title,
          post_name: `menu-${locale}-home`,
          post_type: "nav_menu_item",
          post_status: "publish",
          guid: locale === "en" ? "/" : "/ar",
        },
      ])
      await insert("wp_term_relationships", [
        { object_id: menu, term_taxonomy_id: taxonomy },
      ])
    }
    const defaults = JSON.parse(
      await readFile(resolve("templates/options.json"), "utf8")
    ) as { name: string; value: string }[]
    const options = new Map(defaults.map((o) => [o.name, o.value]))
    for (const name of ["blogname", "blogdescription", "timezone_string"])
      if (data.options[name]) options.set(name, data.options[name])
    for (const [name, value] of Object.entries({
      siteurl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      home: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      admin_email: email,
      users_can_register: "0",
      stylesheet: "pressforge-broadsheet",
      template: "pressforge-broadsheet",
      current_theme: "PressForge Broadsheet",
      show_on_front: "page",
      page_on_front: pages.en,
      active_plugins: "[]",
      nav_menu_locations: JSON.stringify(locations),
      wordpress_migration_version: fingerprint,
    }))
      options.set(name, value)
    await insert(
      "wp_options",
      [...options].map(([name, value]) => ({
        option_name: name,
        option_value: value,
        autoload: "yes",
      }))
    )
    await client.query(
      "ANALYZE wp_posts, wp_postmeta, wp_term_relationships, wp_term_taxonomy, wp_comments"
    )
    await client.query(
      `WITH totals AS (
        SELECT r.term_taxonomy_id,count(*) AS n
        FROM wp_term_relationships r JOIN wp_posts p ON p."ID"=r.object_id
        WHERE p.post_status='publish' AND p.post_type='post'
        GROUP BY r.term_taxonomy_id
      ), counts AS (
        SELECT t.term_taxonomy_id,COALESCE(totals.n,0) AS n
        FROM wp_term_taxonomy t LEFT JOIN totals USING(term_taxonomy_id)
      ) UPDATE wp_term_taxonomy t SET count=counts.n
        FROM counts WHERE t.term_taxonomy_id=counts.term_taxonomy_id`
    )
    await client.query(
      `WITH totals AS (
        SELECT "comment_post_ID",count(*) AS n FROM wp_comments
        WHERE comment_approved='1' GROUP BY "comment_post_ID"
      ), counts AS (
        SELECT p."ID",COALESCE(totals.n,0) AS n
        FROM wp_posts p LEFT JOIN totals ON totals."comment_post_ID"=p."ID"
      ) UPDATE wp_posts p SET comment_count=counts.n
        FROM counts WHERE p."ID"=counts."ID"`
    )
    const checks = (
      await client.query(
        `SELECT (SELECT count(*) FROM wp_posts WHERE post_type='post')::int articles, (SELECT count(*) FROM wp_posts WHERE post_type='attachment')::int attachments, (SELECT count(*) FROM wp_posts WHERE post_type='page')::int pages, (SELECT count(*) FROM wp_term_taxonomy WHERE taxonomy='category')::int categories, (SELECT count(*) FROM wp_postmeta m LEFT JOIN wp_posts p ON p."ID"=NULLIF(m.meta_value,'')::bigint AND p.post_type='attachment' WHERE m.meta_key='_thumbnail_id' AND m.meta_value ~ '^[0-9]+$' AND p."ID" IS NULL)::int broken_featured_references`
      )
    ).rows[0]
    if (
      checks.articles !== articleIds.size ||
      checks.attachments !== posts.length - articleIds.size ||
      checks.pages !== 2 ||
      checks.broken_featured_references !== 0
    )
      throw new Error(
        "Post-import integrity checks failed: " + JSON.stringify(checks)
      )
    for (const [table, column] of [
      ["wp_posts", "ID"],
      ["wp_terms", "term_id"],
      ["wp_term_taxonomy", "term_taxonomy_id"],
      ["wp_comments", "comment_ID"],
    ]) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1,$2),GREATEST(COALESCE(MAX(${quote(column)}),0),1),COALESCE(MAX(${quote(column)}),0)>0) FROM ${quote(table)}`,
        [table, column]
      )
    }
    await client.query("COMMIT")
    const result = {
      ...checks,
      homepages: pages,
      comments: data.comments.length,
      missingOriginalFiles: missingFiles,
      excludedHtmlAttachments,
      credentialsFile: credentialPath,
      sourceSha256: fingerprint,
    }
    await writeFile(
      resolve(out, "result.json"),
      JSON.stringify(result, null, 2)
    )
    console.log(
      JSON.stringify({
        ...checks,
        comments: data.comments.length,
        missingOriginalFiles: missingFiles.length,
        excludedHtmlAttachments: excludedHtmlAttachments.length,
        credentialsSaved: true,
      })
    )
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration failed")
  process.exitCode = 1
})
