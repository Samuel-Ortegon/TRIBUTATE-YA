import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const directorioTrabajo = process.cwd();
const rutaEnvLocal = path.join(directorioTrabajo, '.env.local');
const rutaEnvVercel = path.join(directorioTrabajo, '.env.vercel.local');
const lineaToken = 'VERCEL_OIDC_TOKEN=';

function leerArchivo(ruta) {
  try {
    return fs.readFileSync(ruta, 'utf8');
  } catch {
    return '';
  }
}

function actualizarEnvLocal(nuevoValor) {
  const contenidoActual = leerArchivo(rutaEnvLocal);
  const lineas = contenidoActual
    .split(/\r?\n/)
    .filter((linea) => linea && !linea.startsWith(lineaToken));

  if (nuevoValor) {
    lineas.push(`${lineaToken}${nuevoValor}`);
  }

  const contenidoFinal = `${lineas.join('\n')}${lineas.length > 0 ? '\n' : ''}`;
  fs.writeFileSync(rutaEnvLocal, contenidoFinal, 'utf8');
}

try {
  const resultadoPull = spawnSync('npx', ['vercel', 'env', 'pull', '.env.vercel.local', '--yes'], {
    cwd: directorioTrabajo,
    stdio: 'inherit',
    shell: true,
  });

  if (resultadoPull.status !== 0) {
    throw new Error('Fallo al extraer el token de Vercel.');
  }

  const contenidoVercel = leerArchivo(rutaEnvVercel);
  const linea = contenidoVercel
    .split(/\r?\n/)
    .find((registro) => registro.startsWith(lineaToken));

  if (!linea) {
    throw new Error('No se encontró VERCEL_OIDC_TOKEN en la salida de Vercel.');
  }

  const valorToken = linea.slice(lineaToken.length).trim();
  if (!valorToken) {
    throw new Error('El token no tiene valor.');
  }

  actualizarEnvLocal(valorToken);
} catch {
  console.log('Aviso: no se pudo renovar la conexión con Vercel. El envío de correos no funcionará en local.');
} finally {
  try {
    if (fs.existsSync(rutaEnvVercel)) {
      fs.unlinkSync(rutaEnvVercel);
    }
  } catch {
    // Ignoramos errores al borrar el archivo temporal.
  }
}
