import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for DB operations");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection immediately
pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL bağlantısı başarılı");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL bağlantı hatası:", err);
  });

export const db = drizzle(pool, { schema });
export type DB = typeof db;

