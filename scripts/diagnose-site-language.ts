import "dotenv/config"
import { Client } from "pg"

const client = new Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query("BEGIN READ ONLY")
  for (const [label, sql] of [
    ["languages", "SELECT code,is_default,is_active FROM cms_languages"],
    [
      "homepage",
      "SELECT option_name,option_value FROM wp_options WHERE option_name IN ('show_on_front','page_on_front')",
    ],
    [
      "pages",
      "SELECT p.\"ID\",p.post_name,t.language_code,t.translation_group_id FROM wp_posts p LEFT JOIN cms_post_translations t ON t.post_id=p.\"ID\" WHERE p.post_type='page' AND p.post_status='publish'",
    ],
    [
      "toolbar overrides",
      "SELECT key,value FROM cms_translations WHERE language_code='ar' AND key LIKE 'site.admin_bar.%'",
    ],
    [
      "widget languages",
      "SELECT post_id,meta_value FROM wp_postmeta WHERE meta_key='_studio_data' AND post_id IN (SELECT \"ID\" FROM wp_posts WHERE post_type='page' AND post_status='publish')",
    ],
  ]) {
    const { rows } = await client.query(sql)
    console.log(
      label,
      label === "widget languages"
        ? rows.map((row) => ({
            postId: row.post_id,
            contentLocales: [
              ...String(row.meta_value).matchAll(
                /"contentLocale"\s*:\s*"([^"]*)"/g
              ),
            ].map((m) => m[1]),
          }))
        : rows
    )
  }
} finally {
  await client.end()
}
