import "dotenv/config"
import assert from "node:assert/strict"
import { Client } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { cmsRelations } from "../db/schema/cms-relations"
import { pool } from "../db"
import { saveThemeLayout } from "../services/theme-layout.service"

const client = new Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query(
    "CREATE TEMP TABLE wp_options (option_id bigserial PRIMARY KEY,option_name varchar(191) UNIQUE NOT NULL,option_value text NOT NULL DEFAULT '',autoload varchar(20) NOT NULL DEFAULT 'yes')"
  )
  const temporary = await client.query(
    "SELECT relpersistence FROM pg_class WHERE oid='wp_options'::regclass"
  )
  assert.equal(temporary.rows[0].relpersistence, "t")
  const database = drizzle({ client, relations: cmsRelations })
  const original = {
    layout: "full_width",
    blocks: [{ id: "fixture", order: 7, title: "Preserve" }],
    sections: [
      {
        id: "section",
        rows: [
          {
            columns: [
              { items: [{ type: "widget", widgetId: "fixture-widget" }] },
            ],
          },
        ],
      },
    ],
    future: { keep: true },
  }
  await client.query(
    "INSERT INTO wp_options(option_name,option_value) VALUES ($1,$2),($3,$4)",
    [
      "homepage_settings_pressforge-broadsheet",
      JSON.stringify(original),
      "homepage_blocks_pressforge-broadsheet",
      JSON.stringify(original.blocks),
    ]
  )
  const patch = {
    layout: "left_sidebar",
    sidebarWidth: 300,
    columnGap: 24,
    stickySidebars: false,
  } as const
  await saveThemeLayout("pressforge-broadsheet", patch, database)
  const stored = JSON.parse(
    (
      await client.query(
        "SELECT option_value FROM wp_options WHERE option_name=$1",
        ["homepage_settings_pressforge-broadsheet"]
      )
    ).rows[0].option_value
  )
  assert.deepEqual(stored, { ...original, ...patch })
  assert.equal(
    (
      await client.query(
        "SELECT option_value FROM wp_options WHERE option_name=$1",
        ["homepage_blocks_pressforge-broadsheet"]
      )
    ).rows[0].option_value,
    JSON.stringify(original.blocks)
  )
  assert.equal(
    (
      await client.query(
        "SELECT option_value FROM wp_options WHERE option_name=$1",
        ["homepage_layout_pressforge-broadsheet"]
      )
    ).rows[0].option_value,
    "left_sidebar"
  )
  await saveThemeLayout(
    "pressforge-broadsheet",
    {
      layout: "full_width",
      sidebarWidth: null,
      columnGap: null,
      stickySidebars: true,
    },
    database
  )
  const reset = JSON.parse(
    (
      await client.query(
        "SELECT option_value FROM wp_options WHERE option_name=$1",
        ["homepage_settings_pressforge-broadsheet"]
      )
    ).rows[0].option_value
  )
  assert.deepEqual(reset.blocks, original.blocks)
  assert.deepEqual(reset.sections, original.sections)
  console.log(
    "Temporary-table theme layout integration passed: layout save/reset preserve builder content, unknown fields and legacy blocks. No live settings changed."
  )
} finally {
  await client.end()
  await pool.end()
}
