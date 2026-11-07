import pg from 'pg';

const { Client } = pg;
const sslParameters = ['sslmode', 'sslrootcert', 'sslcert', 'sslkey'];

export function createDatabaseClient(connectionString) {
  const parsedUrl = new URL(connectionString);
  for (const parameter of sslParameters) {
    parsedUrl.searchParams.delete(parameter);
  }

  // Mantiene TLS cifrado sin validar la identidad del servidor.
  return new Client({
    connectionString: parsedUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });
}
