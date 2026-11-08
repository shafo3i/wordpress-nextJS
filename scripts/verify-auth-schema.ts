import "dotenv/config"
import assert from "node:assert/strict"
import { getTableConfig } from "drizzle-orm/pg-core"
import * as schema from "../db/schema/auth-schema"
import { pool } from "../db"

try {
  const tables = Object.values(schema).map((table) => getTableConfig(table))
  const actual = await pool.query<{ table_name: string; column_name: string }>(
    "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=ANY($1)",
    [tables.map((table) => table.name)]
  )
  const names = new Set(
    actual.rows.map((row) => `${row.table_name}.${row.column_name}`)
  )
  const missing = tables.flatMap((table) =>
    table.columns
      .filter((column) => !names.has(`${table.name}.${column.name}`))
      .map((column) => `${table.name}.${column.name}`)
  )
  assert.deepEqual(missing, [], "Authentication schema columns are missing")
  console.log(
    "Live authentication schema verified using read-only inspection:",
    tables.length,
    "tables"
  )
} finally {
  await pool.end()
}
