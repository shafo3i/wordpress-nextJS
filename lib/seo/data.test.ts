import { describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
vi.mock("@/db", () => ({ db: {} }))
import { indexablePostWhere } from "./data"

describe("indexable publication rules", () => {
  it("excludes protected, future, inactive-language and noindex content in SQL", () => {
    const statement = new PgDialect().sqlToQuery(
      indexablePostWhere(new Date("2026-11-09T00:00:00Z"))!
    )
    expect(statement.sql).toContain('"post_password"')
    expect(statement.sql).toContain('"post_date_gmt" <=')
    expect(statement.sql).toContain('"is_active"')
    expect(statement.sql).toContain("not exists")
    expect(statement.sql).toContain("_seo_noindex")
    expect(statement.params).toEqual(
      expect.arrayContaining(["publish", "", true])
    )
  })
})
