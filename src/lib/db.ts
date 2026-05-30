import { Pool, type PoolClient, type QueryResultRow } from "pg";

/* -------------------------------------------------------------------
   PostgreSQL Connection Pool (Supabase uyumlu)
   `pg` paketi ile Pool — Vercel serverless'ta tekrar yaratılmasın diye
   global cache'leniyor. Dev modunda hot-reload sirasinda da korunur.
------------------------------------------------------------------- */

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

function getPool(): Pool {
  if (!globalForPg.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL .env içinde tanımlı olmalı (Supabase connection string).",
      );
    }
    // Supabase her zaman SSL kabul eder; sertifika doğrulamasını
    // kapatıyoruz (Supabase self-signed kullanır). PGSSL=false ile
    // tamamen kapatılabilir (bazı lokal proxy/firewall'lar için).
    globalForPg.pgPool = new Pool({
      connectionString,
      ssl:
        process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForPg.pgPool;
}

export type SqlParams = unknown[];

/** Çoklu satır SELECT — küçük harf kolon adlarıyla. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: SqlParams = [],
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

/** Tek satır veya null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: SqlParams = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE — rowCount dönüş. */
export async function execute(
  sql: string,
  params: SqlParams = [],
): Promise<number> {
  const result = await getPool().query(sql, params);
  return result.rowCount ?? 0;
}

/** Tek transaction; başarıda COMMIT, hatada ROLLBACK. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* swallow */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Transaction client üstünde SELECT (tek satır). */
export async function execOne<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  sql: string,
  params: SqlParams = [],
): Promise<T | null> {
  const r = await client.query<T>(sql, params);
  return r.rows[0] ?? null;
}

/** Transaction client üstünde SELECT (liste). */
export async function execMany<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  sql: string,
  params: SqlParams = [],
): Promise<T[]> {
  const r = await client.query<T>(sql, params);
  return r.rows;
}

/** Transaction client üstünde INSERT/UPDATE/DELETE — rowCount. */
export async function execNoQuery(
  client: PoolClient,
  sql: string,
  params: SqlParams = [],
): Promise<number> {
  const r = await client.query(sql, params);
  return r.rowCount ?? 0;
}

/** CUID benzeri kısa, sıralı id üreteci. */
export function cuid(prefix = ""): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return (prefix + time + rand).slice(0, 32);
}
