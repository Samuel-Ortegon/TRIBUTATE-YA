import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (valor) => valor);
types.setTypeParser(1114, (valor) => valor);
types.setTypeParser(20, (valor) => Number.parseInt(valor, 10));

const globalParaPool = globalThis as typeof globalThis & { poolAgenda?: Pool };
const connectionString =
  process.env.TRIBUTATE_YA_POSTGRES_URL_NON_POOLING
  ?? process.env.TRIBUTATE_YA_POSTGRES_URL
  ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Configura DATABASE_URL o una variable TRIBUTATE_YA_POSTGRES_URL para conectar con PostgreSQL.');
}

const urlConexion = new URL(connectionString);
for (const parametro of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) {
  urlConexion.searchParams.delete(parametro);
}

export const pool = globalParaPool.poolAgenda ?? new Pool({
  connectionString: urlConexion.toString(),
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});

if (process.env.NODE_ENV !== 'production') globalParaPool.poolAgenda = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> {
  const resultado = await pool.query<T>(sql, valores);
  return resultado.rows;
}

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  const tx = await pool.connect();
  try {
    await tx.query('BEGIN');
    const resultado = await trabajo(tx);
    await tx.query('COMMIT');
    return resultado;
  } catch (error) {
    try {
      await tx.query('ROLLBACK');
    } catch (errorRollback) {
      console.error('No se pudo revertir la transacción de PostgreSQL.', errorRollback);
    }
    throw error;
  } finally {
    tx.release();
  }
}
