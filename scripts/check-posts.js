import pg from 'pg';
import 'dotenv/config';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const posts = await pool.query(`
    SELECT p."ID", p.post_title, p.post_name, pt.language_code, pt.translation_group_id 
    FROM wp_posts p 
    LEFT JOIN cms_post_translations pt ON p."ID" = pt.post_id 
    WHERE p.post_type = 'post' 
    LIMIT 30;
  `);
  console.log('Posts count:', posts.rows.length);
  console.log(posts.rows);
  const langs = await pool.query(`SELECT * FROM cms_languages;`);
  console.log('Langs:', langs.rows);
  await pool.end();
}
check().catch(console.error);
