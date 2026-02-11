// Database connection for admin dashboard server components.
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { loadWebConfig } from '@pare-engine/core/config';

const { Pool } = pg;

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    const config = loadWebConfig();
    const pool = new Pool({ connectionString: config.databaseUrl });
    _db = drizzle(pool);
  }
  return _db;
}

/** @deprecated Use getDb() instead — lazy initialization avoids build-time failures. */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop];
  },
});
