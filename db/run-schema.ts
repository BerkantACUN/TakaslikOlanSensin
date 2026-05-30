/**
 * db/schema.postgres.sql dosyasını Supabase'e uygular.
 * Çalıştır: npm run db:reset
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

async function main() {
  const sql = readFileSync(join(process.cwd(), "db", "schema.postgres.sql"), "utf8");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    console.log("→ Schema uygulanıyor...");
    await client.query(sql);
    console.log("✓ Schema hazır.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
