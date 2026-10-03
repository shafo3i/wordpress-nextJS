import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123123aA!@82.71.113.177:5431/postgres' });
async function check() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%term%' OR table_name LIKE '%trans%')");
  console.log('Tables:', res.rows.map(r => r.table_name));
  await pool.end();
}
check().catch(console.error);
