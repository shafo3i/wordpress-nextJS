import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123123aA!@82.71.113.177:5431/postgres' });

async function migrate() {
  console.log('1. Creating cms_term_translations table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_term_translations (
      id BIGSERIAL PRIMARY KEY,
      term_taxonomy_id BIGINT NOT NULL REFERENCES wp_term_taxonomy(term_taxonomy_id) ON DELETE CASCADE,
      language_code VARCHAR(10) NOT NULL REFERENCES cms_languages(code) ON DELETE CASCADE,
      translation_group_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS cms_term_trans_tax_idx ON cms_term_translations(term_taxonomy_id);
    CREATE INDEX IF NOT EXISTS cms_term_trans_group_idx ON cms_term_translations(translation_group_id);
    CREATE INDEX IF NOT EXISTS cms_term_trans_lang_group_idx ON cms_term_translations(translation_group_id, language_code);
  `);
  console.log('Table created successfully.');

  console.log('2. Populating translation groups for existing taxonomy terms...');
  // For each term_taxonomy that does not have a translation record, assign default language (en) and group id = 'term_' || term_taxonomy_id
  const insertRes = await pool.query(`
    INSERT INTO cms_term_translations (term_taxonomy_id, language_code, translation_group_id)
    SELECT 
      tt.term_taxonomy_id,
      COALESCE(tm.meta_value, 'en') as language_code,
      'term_group_' || tt.term_taxonomy_id as translation_group_id
    FROM wp_term_taxonomy tt
    LEFT JOIN wp_termmeta tm ON tm.term_id = tt.term_id AND tm.meta_key = 'language'
    LEFT JOIN cms_term_translations ct ON ct.term_taxonomy_id = tt.term_taxonomy_id
    WHERE ct.id IS NULL;
  `);
  console.log(`Populated ${insertRes.rowCount} terms with translation groups.`);

  await pool.end();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
