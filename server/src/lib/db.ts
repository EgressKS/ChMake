import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';

let dbInstance: any = null;

function getDatabaseUrl(): string {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return DATABASE_URL;
}

function createDatabaseConnection() {
  try {
    const DATABASE_URL = getDatabaseUrl();
    const sql = neon(DATABASE_URL);
    return drizzle(sql, { schema });
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection();
  }
  return dbInstance;
}

// For backward compatibility, also export as db
export const db = new Proxy({} as any, {
  get(target, prop) {
    const dbInstance = getDb();
    return dbInstance[prop];
  }
});
