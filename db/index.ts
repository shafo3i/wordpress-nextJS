import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { cmsRelations } from './schema/cms-relations';
import { Pool } from 'pg'
import { env } from '@/lib/env'


// Next development reloads and server bundles must reuse the same pool within
// a process. Drizzle and maintenance queries also share this exact instance.
const databaseGlobal = globalThis as typeof globalThis & {
    pressforgePool?: Pool;
};

export const pool = databaseGlobal.pressforgePool ?? new Pool({
    connectionString: env.DATABASE_URL,
    application_name: 'pressforge',
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    maxLifetimeSeconds: 60,
});

if (!databaseGlobal.pressforgePool) {
    pool.on('error', (error: NodeJS.ErrnoException) => {
        console.error('PostgreSQL idle connection error:', error.code);
    });
    databaseGlobal.pressforgePool = pool;
}

export const db = drizzle({ client: pool, relations: cmsRelations });


export type DB = typeof db;
