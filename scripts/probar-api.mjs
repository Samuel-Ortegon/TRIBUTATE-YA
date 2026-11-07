import { spawnSync } from 'node:child_process';
import { createDatabaseClient } from './db-client.mjs';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const ccPrueba = '9999990003';
const ccInexistente = '9999990099';
let fallas = 0;
let preflightCorrecto = false;
let fechaDisponible = '';
let horaDisponible = '';
let citaEsperada = null;
const credenciales = { cc: ccPrueba, ultimos4: '0003' };

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

async function consultar(ruta, opciones = {}) {
  const respuesta = await fetch(new URL(ruta, baseUrl), opciones);
  let cuerpo;
  try { cuerpo = await respuesta.json(); }
  catch { cuerpo = null; }
  return { status: respuesta.status, cuerpo };
}

async function paso(numero, descripcion, accion) {
  try {
    await accion();
    console.log(`OK    Paso ${numero} · ${descripcion}`);
  } catch (error) {
    fallas += 1;
    const detalle = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`FALLA Paso ${numero} · ${descripcion} · ${detalle}`);
  }
}

function json(datos) {
  return { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(datos) };
}

function fechaBogota() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

const datosRegistro = {
  cc: ccPrueba,
  nombre: 'Cliente de prueba API',
  telefono: '3001230003',
  correo: `${ccPrueba}@example.test`,
  aceptaTratamientoDatos: true,
};

const connectionString = process.env.TRIBUTATE_YA_POSTGRES_URL_NON_POOLING
  ?? process.env.DATABASE_URL
  ?? process.env.TRIBUTATE_YA_POSTGRES_URL;
if (!connectionString) throw new Error('No se configuró la conexión de PostgreSQL.');
const clienteDB = createDatabaseClient(connectionString);

try {
  await clienteDB.connect();
  const existentes = await clienteDB.query(
    'SELECT count(*)::int AS cantidad FROM clientes WHERE cc = ANY($1::varchar[])',
    [[ccPrueba, ccInexistente]],
  );
  assert(Number(existentes.rows[0]?.cantidad ?? 0) === 0,
    'Las cédulas reservadas para la prueba ya existen; se detiene sin modificarlas.');
  preflightCorrecto = true;

  await paso(1, 'Registrar cliente válido', async () => {
    const respuesta = await consultar('/api/publico/clientes', json(datosRegistro));
    assert(respuesta.status === 201, `HTTP ${respuesta.status}.`);
    assert(respuesta.cuerpo?.datos?.registrado === true, 'La respuesta no confirmó el registro.');
  });
  await paso(2, 'Rechazar cédula duplicada', async () => {
    const respuesta = await consultar('/api/publico/clientes', json(datosRegistro));
    assert(respuesta.status === 409 && respuesta.cuerpo?.error?.codigo === 'CC_DUPLICADA',
      `HTTP ${respuesta.status}; código ${respuesta.cuerpo?.error?.codigo ?? 'sin código'}.`);
  });
  await paso(3, 'Rechazar registro sin autorización de datos', async () => {
    const respuesta = await consultar('/api/publico/clientes', json({ ...datosRegistro, cc: '9999990098', aceptaTratamientoDatos: false }));
    assert(respuesta.status === 400 && respuesta.cuerpo?.error?.codigo === 'DATOS_INVALIDOS',
      `HTTP ${respuesta.status}; código ${respuesta.cuerpo?.error?.codigo ?? 'sin código'}.`);
  });
  await paso(4, 'Consultar fecha límite del cliente', async () => {
    const respuesta = await consultar('/api/publico/fecha-limite', json({ cc: ccPrueba }));
    assert(respuesta.status === 200 && typeof respuesta.cuerpo?.datos?.estado === 'string',
      `HTTP ${respuesta.status}.`);
  });
  await paso(5, 'Rechazar cédula inexistente', async () => {
    const respuesta = await consultar('/api/publico/fecha-limite', json({ cc: ccInexistente }));
    assert(respuesta.status === 404 && respuesta.cuerpo?.error?.codigo === 'CLIENTE_NO_ENCONTRADO',
      `HTTP ${respuesta.status}; código ${respuesta.cuerpo?.error?.codigo ?? 'sin código'}.`);
  });
  await paso(6, 'Encontrar fecha con horarios disponibles', async () => {
    const base = fechaBogota();
    for (let dia = 1; dia <= 30; dia += 1) {
      const fecha = new Date(`${base}T00:00:00.000Z`);
      fecha.setUTCDate(fecha.getUTCDate() + dia);
      const candidata = fecha.toISOString().slice(0, 10);
      const respuesta = await consultar(`/api/publico/disponibilidad?fecha=${candidata}`);
      if (respuesta.status === 200 && Array.isArray(respuesta.cuerpo?.datos?.horarios) && respuesta.cuerpo.datos.horarios.length) {
        fechaDisponible = candidata;
        horaDisponible = respuesta.cuerpo.datos.horarios[0];
        break;
      }
    }
    assert(!!horaDisponible, 'No se encontró una cita disponible en los próximos 30 días.');
  });
  await paso(7, 'Rechazar últimos cuatro dígitos incorrectos', async () => {
    const respuesta = await consultar('/api/publico/citas', json({
      ...credenciales, ultimos4: '1111', fecha: fechaDisponible, hora: horaDisponible,
    }));
    assert(respuesta.status === 404 && respuesta.cuerpo?.error?.codigo === 'DATOS_NO_COINCIDEN',
      `HTTP ${respuesta.status}; código ${respuesta.cuerpo?.error?.codigo ?? 'sin código'}.`);
  });
  await paso(8, 'Agendar con verificación correcta', async () => {
    const respuesta = await consultar('/api/publico/citas', json({
      ...credenciales, fecha: fechaDisponible, hora: horaDisponible,
    }));
    assert(respuesta.status === 201, `HTTP ${respuesta.status}; código ${respuesta.cuerpo?.error?.codigo ?? 'sin código'}.`);
    const cita = respuesta.cuerpo?.datos;
    assert(cita?.fecha === fechaDisponible && cita?.hora === horaDisponible && typeof cita?.horaFin === 'string',
      'La respuesta no contiene el resumen de la cita.');
    assert(!('citaId' in cita) && !('clienteId' in cita), 'La respuesta expuso un identificador interno.');
    citaEsperada = cita;
  });
  await paso(9, 'Rechazar segunda cita activa', async () => {
    const respuesta = await consultar('/api/publico/citas', json({
      ...credenciales, fecha: fechaDisponible, hora: horaDisponible,
    }));
    assert(respuesta.status === 409 && respuesta.cuerpo?.error?.codigo === 'CITA_ACTIVA_EXISTENTE',
      `HTTP ${respuesta.status}; código ${respuesta.cuerpo?.error?.codigo ?? 'sin código'}.`);
  });
  await paso(10, 'Consultar mi cita sin exponer identificadores', async () => {
    const respuesta = await consultar('/api/publico/mi-cita', json(credenciales));
    assert(respuesta.status === 200, `HTTP ${respuesta.status}.`);
    const cita = respuesta.cuerpo?.datos?.cita;
    assert(cita?.fecha === citaEsperada?.fecha && cita?.hora === citaEsperada?.hora,
      'No se devolvió la cita esperada.');
    assert(!('id' in cita) && !('clienteId' in cita), 'La respuesta expuso un identificador interno.');
  });
  await paso(11, 'Cancelar mi cita', async () => {
    const respuesta = await consultar('/api/publico/mi-cita/cancelar', json(credenciales));
    assert(respuesta.status === 200 && respuesta.cuerpo?.datos?.cancelada === true,
      `HTTP ${respuesta.status}.`);
  });
  await paso(12, 'Confirmar que ya no hay cita activa', async () => {
    const respuesta = await consultar('/api/publico/mi-cita', json(credenciales));
    assert(respuesta.status === 200 && respuesta.cuerpo?.datos?.cita === null,
      `HTTP ${respuesta.status}; la cita no quedó cancelada.`);
  });
} catch (error) {
  fallas += 1;
  console.error(`FALLA Preparación · ${error instanceof Error ? error.message : 'Error desconocido'}`);
} finally {
  await clienteDB.end();
  if (preflightCorrecto) {
    const limpieza = spawnSync(process.execPath, [
      '--env-file=.env.local', 'scripts/limpiar-cliente.mjs', ccPrueba,
    ], { stdio: 'inherit' });
    if (limpieza.status !== 0) {
      fallas += 1;
      console.error('FALLA Limpieza · No se pudieron borrar los registros de prueba.');
    }
  }
}

console.log(`Total de fallas: ${fallas}`);
if (fallas) process.exitCode = 1;
