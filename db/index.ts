import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { cmsRelations } from './schema/cms-relations';

export const db = drizzle(process.env.DATABASE_URL!, { relations: cmsRelations });