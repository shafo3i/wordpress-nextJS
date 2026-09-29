import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { cmsRelations } from './schema/cms-relations';
import { Pool } from 'pg'
import { env } from '@/lib/env'


export const pool = new Pool({
    connectionString: env.DATABASE_URL
})

export const db = drizzle(env.DATABASE_URL, { logger: true, relations: cmsRelations });


export type DB = typeof db;