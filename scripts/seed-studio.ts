import "dotenv/config"
import { Client } from "pg"
import sharp from "sharp"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import seed from "../templates/seed/studio-bilingual.json"
import { studioDocumentSchema } from "../db/schema/cms-studio"
import {
  createStudioContainerFromPreset,
  createStudioElement,
} from "../lib/studio/tree-helpers"
import type { StudioDocumentData } from "../lib/studio/types"

const CMS_TABLES = [
  "cms_languages",
  "cms_post_translations",
  "cms_term_translations",
  "cms_translations",
  "wp_commentmeta",
  "wp_comments",
  "wp_links",
  "wp_options",
  "wp_postmeta",
  "wp_posts",
  "wp_term_relationships",
  "wp_term_taxonomy",
  "wp_termmeta",
  "wp_terms",
  "wp_usermeta",
]
const locales = ["en", "ar"] as const
type Locale = (typeof locales)[number]
const args = process.argv.slice(2)
const argument = (name: string) => args[args.indexOf(name) + 1]
const quote = (identifier: string) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier))
    throw new Error("Invalid SQL identifier")
  return `"${identifier}"`
}
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

async function main() {
  const target = new URL(process.env.DATABASE_URL || "")
  const database = decodeURIComponent(target.pathname.slice(1))
  const publishedCount = seed.categories.reduce(
    (n, category) => n + category.topics.length * 2,
    0
  )
  console.log(
    JSON.stringify({
      target: { host: target.hostname, database },
      plan: {
        cmsTables: CMS_TABLES.length,
        publishedPosts: publishedCount,
        categoryPairs: seed.categories.length,
        pagePairs: 3,
        preserved:
          "Existing users, administrator credentials, authentication tables, site URLs and SMTP configuration",
      },
    })
  )
  if (!args.includes("--reset")) {
    console.log(
      "Dry run only. Supply --reset --expect-host HOST --expect-database NAME to execute."
    )
    return
  }
  if (
    argument("--expect-host") !== target.hostname ||
    argument("--expect-database") !== database
  )
    throw new Error("Reset target confirmation does not match DATABASE_URL.")

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
  })
  const insert = async (
    table: string,
    values: Record<string, unknown>,
    returning = "ID"
  ): Promise<string> => {
    const keys = Object.keys(values)
    const result = await client.query(
      `INSERT INTO ${quote(table)} (${keys.map(quote).join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) RETURNING ${quote(returning)}::text AS id`,
      Object.values(values)
    )
    return result.rows[0].id
  }
  const meta = (postId: string, key: string, value: string) =>
    insert(
      "wp_postmeta",
      { post_id: postId, meta_key: key, meta_value: value },
      "meta_id"
    )
  const translatePost = (postId: string, locale: Locale, group: string) =>
    insert(
      "cms_post_translations",
      { post_id: postId, language_code: locale, translation_group_id: group },
      "id"
    )
  try {
    await client.connect()
    const actual = await client.query("SELECT current_database() AS database")
    if (actual.rows[0].database !== database)
      throw new Error("Connected database does not match confirmed target.")
    const admins = await client.query(
      'SELECT id FROM "user" WHERE role = $1 ORDER BY created_at LIMIT 1',
      ["admin"]
    )
    if (!admins.rows.length)
      throw new Error(
        "No administrator account exists; reset cancelled to avoid locking you out."
      )

    // Prepare deterministic local illustrations; no third-party image URLs or runtime fallbacks.
    const imageDir = resolve("public/seed/studio")
    await mkdir(imageDir, { recursive: true })
    for (const category of seed.categories) {
      const illustration = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760"><rect width="1200" height="760" fill="${category.color}"/><circle cx="980" cy="130" r="290" fill="#ffffff" opacity=".09"/><rect x="96" y="112" width="410" height="24" rx="12" fill="#ffffff" opacity=".7"/><rect x="96" y="164" width="640" height="52" rx="8" fill="#ffffff"/><rect x="96" y="240" width="480" height="30" rx="6" fill="#ffffff" opacity=".55"/><path d="M100 610L310 470L510 525L735 350L1055 240" fill="none" stroke="#ffffff" stroke-width="15"/><path d="M100 610H1080" stroke="#ffffff" stroke-width="3" opacity=".4"/></svg>`
      await sharp(Buffer.from(illustration))
        .webp({ quality: 88 })
        .toFile(resolve(imageDir, `${category.key}.webp`))
    }

    await client.query("BEGIN")
    await client.query("SET LOCAL lock_timeout = '10s'")
    await client.query(
      `LOCK TABLE ${CMS_TABLES.map(quote).join(",")} IN ACCESS EXCLUSIVE MODE`
    )
    const backup: Record<string, unknown> = {
      capturedAt: new Date().toISOString(),
      database,
      host: target.hostname,
      tables: {},
    }
    const tables = backup.tables as Record<string, unknown>
    for (const table of CMS_TABLES)
      tables[table] = (await client.query(`SELECT * FROM ${quote(table)}`)).rows
    const backupDir = resolve(".local/seed-backups")
    await mkdir(backupDir, { recursive: true })
    const backupPath = resolve(
      backupDir,
      `cms-before-studio-${new Date().toISOString().replaceAll(":", "-")}.json`
    )
    await writeFile(backupPath, JSON.stringify(backup, null, 2), { flag: "wx" })

    const retainedOptions = (
      tables.wp_options as {
        option_name: string
        option_value: string
        autoload: string
      }[]
    ).filter(
      (row) =>
        ["siteurl", "home"].includes(row.option_name) ||
        row.option_name.startsWith("smtp_")
    )
    await client.query(
      `TRUNCATE TABLE ${CMS_TABLES.map(quote).join(",")} RESTART IDENTITY`
    )
    for (const [index, locale] of locales.entries()) {
      const language = seed.locales[locale]
      await insert(
        "cms_languages",
        {
          code: locale,
          name: language.name,
          native_name: language.nativeName,
          direction: language.direction,
          is_default: locale === "en",
          is_active: true,
          display_order: index,
        },
        "code"
      )
      const dict = JSON.parse(
        await readFile(resolve(`templates/language/${locale}.json`), "utf8")
      ) as Record<string, string>
      const entries = Object.entries(dict)
      for (let offset = 0; offset < entries.length; offset += 400) {
        const chunk = entries.slice(offset, offset + 400)
        await client.query(
          `INSERT INTO cms_translations(language_code,key,value) VALUES ${chunk.map((_, i) => `($${i * 3 + 1},$${i * 3 + 2},$${i * 3 + 3})`).join(",")}`,
          chunk.flatMap(([key, value]) => [locale, key, value])
        )
      }
    }

    const author: Record<string, string> = {}
    for (const locale of locales) {
      const result = await client.query(
        'INSERT INTO "user" (id,name,email,email_verified,role) VALUES ($1,$2,$3,true,$4) ON CONFLICT(email) DO UPDATE SET name=excluded.name RETURNING id',
        [
          `studio-seed-author-${locale}`,
          seed.locales[locale].author,
          `studio-author-${locale}@example.test`,
          "author",
        ]
      )
      author[locale] = result.rows[0].id
    }
    const categories = new Map<
      string,
      { id: string; slug: string; image: string }
    >()
    for (const category of seed.categories)
      for (const locale of locales) {
        const label = category[locale]
        const term = await insert(
          "wp_terms",
          { name: label.name, slug: label.slug },
          "term_id"
        )
        const taxonomy = await insert(
          "wp_term_taxonomy",
          { term_id: term, taxonomy: "category", description: label.summary },
          "term_taxonomy_id"
        )
        await insert(
          "cms_term_translations",
          {
            term_taxonomy_id: taxonomy,
            language_code: locale,
            translation_group_id: `seed:category:${category.key}`,
          },
          "id"
        )
        await insert(
          "wp_termmeta",
          { term_id: term, meta_key: "language", meta_value: locale },
          "meta_id"
        )
        const image = await insert("wp_posts", {
          post_author: author[locale],
          post_title: label.name,
          post_name: `seed-cover-${category.key}-${locale}`,
          post_type: "attachment",
          post_status: "inherit",
          post_mime_type: "image/webp",
          guid: `/seed/studio/${category.key}.webp`,
        })
        await translatePost(image, locale, `seed:media:${category.key}`)
        await meta(image, "_wp_attachment_image_alt", label.name)
        categories.set(`${category.key}:${locale}`, {
          id: taxonomy,
          slug: label.slug,
          image,
        })
      }

    let sequence = 0
    const firstPosts: Record<string, string> = {}
    for (const category of seed.categories)
      for (const [index, topic] of category.topics.entries()) {
        const date = new Date(
          Date.UTC(2026, 9, 1, 8) + sequence++ * 8 * 60 * 60 * 1000
        )
        for (const [languageIndex, locale] of locales.entries()) {
          const language = seed.locales[locale]
          const translated = category[locale]
          const taxonomy = categories.get(`${category.key}:${locale}`)!
          const title = topic[languageIndex]
          const content = `<p>${escape(translated.summary)}</p><h2>${escape(language.context)}</h2><p>${escape(title)}. ${escape(translated.summary)}</p><p><em>${escape(language.note)}</em></p>`
          const post = await insert("wp_posts", {
            post_author: author[locale],
            post_title: title,
            post_name: `${category.key}-${index + 1}-${locale}`,
            post_content: content,
            post_excerpt: translated.summary,
            post_date: date,
            post_date_gmt: date,
            post_modified: date,
            post_modified_gmt: date,
            post_status: "publish",
            post_type: "post",
            comment_status: "open",
            guid: `/posts/${category.key}-${index + 1}-${locale}`,
          })
          await translatePost(
            post,
            locale,
            `seed:article:${category.key}:${index + 1}`
          )
          await insert(
            "wp_term_relationships",
            { object_id: post, term_taxonomy_id: taxonomy.id },
            "object_id"
          )
          await meta(post, "_thumbnail_id", taxonomy.image)
          await meta(post, "_is_featured", index < 2 ? "1" : "0")
          firstPosts[locale] ||= post
        }
      }

    // Non-public fixtures prove widget feeds never leak drafts/private/scheduled content.
    for (const status of ["draft", "pending", "private", "future"])
      for (const locale of locales) {
        const post = await insert("wp_posts", {
          post_author: author[locale],
          post_title: `${seed.locales[locale].businessHub} — ${status}`,
          post_name: `seed-${status}-${locale}`,
          post_type: "post",
          post_status: status,
          post_date: new Date("2027-01-01T12:00:00Z"),
          post_content: `<p>${escape(seed.locales[locale].note)}</p>`,
        })
        await translatePost(post, locale, `seed:status:${status}`)
        await insert(
          "wp_term_relationships",
          {
            object_id: post,
            term_taxonomy_id: categories.get(`business:${locale}`)!.id,
          },
          "object_id"
        )
      }

    const makeDocument = (
      locale: Locale,
      businessOnly = false
    ): StudioDocumentData => {
      const requested = businessOnly
        ? ["business"]
        : ["featured", "business", "technology", "world", "education"]
      const elements = requested.map((key) => {
        const section = createStudioContainerFromPreset("100")
        const widget = createStudioElement(
          key === "featured" ? "block_featured_hero_slider" : "block_news_list"
        )
        const category = seed.categories.find((item) => item.key === key)
        const titles =
          key === "featured"
            ? { en: seed.locales.en.featured, ar: seed.locales.ar.featured }
            : { en: category!.en.name, ar: category!.ar.name }
        widget.settings.blockConfig = {
          ...widget.settings.blockConfig!,
          title: titles[locale],
          titles,
          postCount: businessOnly ? 12 : 6,
          ...(category
            ? {
                categoryId: categories.get(`${key}:en`)!.id,
                categorySlug: category.en.slug,
              }
            : { categorySlug: "all", featuredOnly: true }),
        }
        section.elements[0].elements.push(widget)
        return section
      })
      return studioDocumentSchema.parse({
        version: "1.0",
        pageTemplate: "studio_full_width",
        elements,
        settings: { pageTemplate: "studio_full_width", hideTitle: true },
      })
    }
    const pages = new Map<string, string>()
    for (const key of ["home", "businessHub", "about"] as const)
      for (const locale of locales) {
        const slug =
          key === "home"
            ? `home-${locale}`
            : key === "businessHub"
              ? `business-desk-${locale}`
              : `about-${locale}`
        const page = await insert("wp_posts", {
          post_author: author[locale],
          post_title: seed.locales[locale][key],
          post_name: slug,
          post_type: "page",
          post_status: "publish",
          post_content:
            key === "about"
              ? `<p>${escape(seed.locales[locale].aboutText)}</p>`
              : "",
          guid: `/${slug}`,
        })
        await translatePost(page, locale, `seed:page:${key}`)
        if (key !== "about") {
          await meta(page, "_studio_edit_mode", "builder")
          await meta(
            page,
            "_studio_data",
            JSON.stringify(makeDocument(locale, key === "businessHub"))
          )
          await meta(page, "_wp_page_template", "studio_full_width")
        }
        pages.set(`${key}:${locale}`, page)
      }
    const locations: Record<string, string> = {}
    for (const locale of locales) {
      const term = await insert(
        "wp_terms",
        { name: seed.locales[locale].home, slug: `primary-${locale}` },
        "term_id"
      )
      const taxonomy = await insert(
        "wp_term_taxonomy",
        { term_id: term, taxonomy: "nav_menu" },
        "term_taxonomy_id"
      )
      await insert(
        "wp_termmeta",
        { term_id: term, meta_key: "language", meta_value: locale },
        "meta_id"
      )
      locations[`primary_${locale}`] = taxonomy
      locations[`footer_${locale}`] = taxonomy
      for (const [index, key] of (
        ["home", "businessHub", "about"] as const
      ).entries()) {
        const url =
          key === "home"
            ? locale === "en"
              ? "/"
              : "/ar"
            : `${locale === "en" ? "" : "/ar"}/${key === "businessHub" ? "business-desk" : "about"}-${locale}`
        const item = await insert("wp_posts", {
          post_author: author[locale],
          post_title: seed.locales[locale][key],
          post_name: `menu-${locale}-${key}`,
          post_type: "nav_menu_item",
          post_status: "publish",
          menu_order: index,
          guid: url,
        })
        await insert(
          "wp_term_relationships",
          { object_id: item, term_taxonomy_id: taxonomy },
          "object_id"
        )
      }
      await insert(
        "wp_comments",
        {
          comment_post_ID: firstPosts[locale],
          comment_author: seed.locales[locale].author,
          comment_author_email: `reader-${locale}@example.test`,
          comment_content: seed.locales[locale].aboutText,
          comment_approved: "1",
        },
        "comment_ID"
      )
    }

    const defaults = JSON.parse(
      await readFile(resolve("templates/options.json"), "utf8")
    ) as { name: string; value: string }[]
    const options = new Map(defaults.map((item) => [item.name, item.value]))
    for (const row of retainedOptions)
      options.set(row.option_name, row.option_value)
    for (const [name, value] of Object.entries({
      blogname: "PressForge Newsroom",
      blogdescription:
        "Bilingual development newsroom · غرفة أخبار تجريبية باللغتين",
      timezone_string: "Europe/London",
      stylesheet: "pressforge-broadsheet",
      template: "pressforge-broadsheet",
      current_theme: "PressForge Broadsheet",
      show_on_front: "page",
      page_on_front: pages.get("home:en")!,
      active_plugins: "[]",
      users_can_register: "0",
      nav_menu_locations: JSON.stringify(locations),
      studio_seed_version: "bilingual-1",
    }))
      options.set(name, value)
    for (const [name, value] of options)
      await insert(
        "wp_options",
        { option_name: name, option_value: value, autoload: "yes" },
        "option_id"
      )
    await client.query(
      `UPDATE wp_term_taxonomy t SET count=(SELECT count(*) FROM wp_term_relationships r JOIN wp_posts p ON p."ID"=r.object_id WHERE r.term_taxonomy_id=t.term_taxonomy_id AND p.post_status='publish' AND p.post_type='post')`
    )
    await client.query(
      `UPDATE wp_posts p SET comment_count=(SELECT count(*) FROM wp_comments c WHERE c."comment_post_ID"=p."ID" AND c.comment_approved='1')`
    )
    const duplicates = await client.query(
      "SELECT translation_group_id,language_code FROM cms_term_translations GROUP BY 1,2 HAVING count(*)>1"
    )
    if (duplicates.rows.length)
      throw new Error("Duplicate category translations in seed")
    const mixed = await client.query(
      "SELECT count(*)::int AS total FROM wp_term_relationships r JOIN cms_post_translations p ON p.post_id=r.object_id JOIN cms_term_translations t ON t.term_taxonomy_id=r.term_taxonomy_id WHERE p.language_code<>t.language_code"
    )
    if (mixed.rows[0].total)
      throw new Error("Seed post/category languages do not match")
    const postCounts = await client.query(
      `SELECT tr.language_code,count(*)::int AS count FROM wp_posts p JOIN cms_post_translations tr ON tr.post_id=p."ID" WHERE p.post_type='post' AND p.post_status='publish' GROUP BY 1`
    )
    if (
      postCounts.rows.length !== 2 ||
      postCounts.rows.some((row) => row.count !== publishedCount / 2)
    )
      throw new Error("Unbalanced seed languages")
    await client.query("COMMIT")
    console.log(
      JSON.stringify(
        {
          reset: "committed",
          publishedPosts: postCounts.rows,
          pages: Object.fromEntries(pages),
          backupPath,
          adminLogin: "preserved",
        },
        null,
        2
      )
    )
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Studio seed failed")
  process.exitCode = 1
})
