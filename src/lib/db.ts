import oracledb from "oracledb";

/* -------------------------------------------------------------------
   Oracle Connection Pool
   Tek bir global pool, dev modunda hot-reload sırasında yeniden
   yaratılmaz. Thin driver kullanır (Oracle Instant Client gerekmez).
------------------------------------------------------------------- */

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

const POOL_ALIAS = "campusswap";

const globalForOracle = globalThis as unknown as {
  oraclePoolReady?: Promise<oracledb.Pool>;
};

function createPool(): Promise<oracledb.Pool> {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;
  if (!user || !password || !connectString) {
    throw new Error(
      "ORACLE_USER / ORACLE_PASSWORD / ORACLE_CONNECT_STRING .env içinde tanımlı olmalı",
    );
  }
  return oracledb.createPool({
    user,
    password,
    connectString,
    poolAlias: POOL_ALIAS,
    poolMin: Number(process.env.ORACLE_POOL_MIN ?? 2),
    poolMax: Number(process.env.ORACLE_POOL_MAX ?? 10),
    poolIncrement: 1,
  });
}

function getPool(): Promise<oracledb.Pool> {
  if (!globalForOracle.oraclePoolReady) {
    globalForOracle.oraclePoolReady = createPool();
  }
  return globalForOracle.oraclePoolReady;
}

export async function withConn<T>(
  fn: (conn: oracledb.Connection) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    await conn.close();
  }
}

export type SqlBinds = Record<string, unknown> | unknown[];

/** Çoklu satır SELECT. Returns row[]. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: SqlBinds = {},
): Promise<T[]> {
  return withConn(async (conn) => {
    const r = await conn.execute<T>(sql, binds as any, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return (r.rows ?? []) as T[];
  });
}

/** Tek satır veya null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  binds: SqlBinds = {},
): Promise<T | null> {
  const rows = await query<T>(sql, binds);
  return rows[0] ?? null;
}

/** INSERT / UPDATE / DELETE — rowsAffected dönüş. */
export async function execute(sql: string, binds: SqlBinds = {}): Promise<number> {
  return withConn(async (conn) => {
    const r = await conn.execute(sql, binds as any);
    return r.rowsAffected ?? 0;
  });
}

/** Birden fazla sorguyu tek transaction içinde çalıştır. */
export async function tx<T>(
  fn: (conn: oracledb.Connection) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    // Manuel commit için autoCommit false
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      /* swallow */
    }
    throw err;
  } finally {
    await conn.close();
  }
}

/** Connection üstünde tek satır çalıştır + nesne dön. */
export async function execOne<T = Record<string, unknown>>(
  conn: oracledb.Connection,
  sql: string,
  binds: SqlBinds = {},
): Promise<T | null> {
  const r = await conn.execute<T>(sql, binds as any, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    autoCommit: false,
  });
  return (r.rows?.[0] ?? null) as T | null;
}

/** Connection üstünde liste sorgusu. */
export async function execMany<T = Record<string, unknown>>(
  conn: oracledb.Connection,
  sql: string,
  binds: SqlBinds = {},
): Promise<T[]> {
  const r = await conn.execute<T>(sql, binds as any, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    autoCommit: false,
  });
  return (r.rows ?? []) as T[];
}

/** Connection üstünde INSERT/UPDATE/DELETE — manuel commit. */
export async function execNoQuery(
  conn: oracledb.Connection,
  sql: string,
  binds: SqlBinds = {},
): Promise<number> {
  const r = await conn.execute(sql, binds as any, { autoCommit: false });
  return r.rowsAffected ?? 0;
}

/** CUID benzeri kısa, sıralı id üreteci (zaman tabanlı + random). */
export function cuid(prefix = ""): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return (prefix + time + rand).slice(0, 32);
}
