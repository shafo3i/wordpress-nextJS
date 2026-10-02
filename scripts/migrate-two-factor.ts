import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Applying two-factor schema migrations to PostgreSQL...");

  // 1. Add two_factor_enabled to user table
  await db.execute(sql`
    ALTER TABLE "user" 
    ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false;
  `);
  console.log("Added column 'two_factor_enabled' to table 'user'.");

  // 2. Create two_factor table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "two_factor" (
      "id" text PRIMARY KEY,
      "secret" text NOT NULL,
      "backup_codes" text NOT NULL,
      "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "verified" boolean DEFAULT true,
      "failed_verification_count" integer DEFAULT 0,
      "locked_until" timestamp
    );
  `);
  console.log("Created table 'two_factor'.");

  // 3. Create indices
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "twoFactor_secret_idx" ON "two_factor" ("secret");
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "twoFactor_userId_idx" ON "two_factor" ("user_id");
  `);
  console.log("Created indices for 'two_factor'.");

  // 4. Create rate_limit table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rate_limit" (
      "id" text PRIMARY KEY,
      "key" text NOT NULL UNIQUE,
      "count" integer DEFAULT 0 NOT NULL,
      "last_request" bigint NOT NULL
    );
  `);
  console.log("Created table 'rate_limit'.");

  console.log("Auth schema migrations completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
