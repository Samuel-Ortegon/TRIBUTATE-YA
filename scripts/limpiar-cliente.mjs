import { createDatabaseClient } from './db-client.mjs';

const cedulas = process.argv.slice(2);
if (!cedulas.length || cedulas.some((cc) => !/^\d{6,10}$/.test(cc))) {
  console.error('Indique una o varias cédulas válidas como argumentos.');
  process.exit(1);
}

const connectionString = process.env.TRIBUTATE_YA_POSTGRES_URL_NON_POOLING
  ?? process.env.DATABASE_URL
  ?? process.env.TRIBUTATE_YA_POSTGRES_URL;
if (!connectionString) throw new Error('No se configuró la conexión de PostgreSQL.');

const cliente = createDatabaseClient(connectionString);
const tablas = [
  ['eventos_cliente', 'DELETE FROM eventos_cliente WHERE cliente_id IN (SELECT id FROM clientes WHERE cc = ANY($1::varchar[]))'],
  ['revisiones', 'DELETE FROM revisiones WHERE cliente_id IN (SELECT id FROM clientes WHERE cc = ANY($1::varchar[]))'],
  ['pagos', 'DELETE FROM pagos WHERE cliente_id IN (SELECT id FROM clientes WHERE cc = ANY($1::varchar[]))'],
  ['citas', 'DELETE FROM citas WHERE cliente_id IN (SELECT id FROM clientes WHERE cc = ANY($1::varchar[]))'],
  ['clientes', 'DELETE FROM clientes WHERE cc = ANY($1::varchar[])'],
];

try {
  await cliente.connect();
  await cliente.query('BEGIN');
  for (const [tabla, sql] of tablas) {
    const resultado = await cliente.query(sql, [cedulas]);
    console.log(`${tabla}: ${resultado.rowCount ?? 0}`);
  }
  await cliente.query('COMMIT');
} catch (error) {
  await cliente.query('ROLLBACK').catch((errorRollback) => {
    console.error('No se pudo revertir la limpieza.', errorRollback);
  });
  throw error;
} finally {
  await cliente.end();
}
