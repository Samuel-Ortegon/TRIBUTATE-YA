import fs from 'node:fs/promises';
import path from 'node:path';
import { createDatabaseClient } from './db-client.mjs';

const directorio = path.join(process.cwd(), 'supabase', 'migrations');
const migrationUrl =
  process.env.TRIBUTATE_YA_POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.TRIBUTATE_YA_POSTGRES_URL;

if (!migrationUrl) {
  console.error('Falta DATABASE_URL o TRIBUTATE_YA_POSTGRES_URL en el entorno.');
  process.exit(1);
}

const client = createDatabaseClient(migrationUrl);

async function existeTablaPublica(nombre) {
  const resultado = await client.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS existe;`,
    [nombre],
  );
  return resultado.rows[0]?.existe === true;
}

async function ensureMigrationsTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id SERIAL PRIMARY KEY,
      archivo TEXT NOT NULL UNIQUE,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function registrarMigracionSiExisteAnterior() {
  const archivosPrevios = ['20261003000000_create_users.sql'];
  for (const archivo of archivosPrevios) {
    const ruta = path.join(directorio, archivo);
    try {
      await fs.access(ruta);
    } catch {
      continue;
    }

    const yaRegistrada = await client.query('SELECT 1 FROM public._migrations WHERE archivo = $1', [archivo]);
    if (yaRegistrada.rowCount > 0) {
      continue;
    }

    if (archivo === '20261003000000_create_users.sql' && (await existeTablaPublica('users'))) {
      await client.query('INSERT INTO public._migrations (archivo) VALUES ($1) ON CONFLICT (archivo) DO NOTHING', [archivo]);
      console.log(`omitida: ${archivo} (ya aplicada por otro medio)`);
    }
  }
}

async function aplicarMigracion(archivo) {
  const ruta = path.join(directorio, archivo);
  const sql = await fs.readFile(ruta, 'utf8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO public._migrations (archivo) VALUES ($1) ON CONFLICT (archivo) DO NOTHING', [archivo]);
    await client.query('COMMIT');
    console.log(`aplicada: ${archivo}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

try {
  await client.connect();
  await ensureMigrationsTable();
  await registrarMigracionSiExisteAnterior();

  const archivos = (await fs.readdir(directorio)).filter((nombre) => nombre.endsWith('.sql')).sort();

  for (const archivo of archivos) {
    const yaAplicada = await client.query('SELECT 1 FROM public._migrations WHERE archivo = $1', [archivo]);
    if (yaAplicada.rowCount > 0) {
      continue;
    }

    await aplicarMigracion(archivo);
  }

  console.log('Migraciones completadas.');
} catch (error) {
  console.error('ERROR EN MIGRACIONES');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
