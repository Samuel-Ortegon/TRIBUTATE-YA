import { spawnSync } from 'node:child_process';
import { pool } from '@/lib/db/conexion';
import {
  agendarCita,
  iniciarTramite,
  obtenerDetalleCliente,
  obtenerHorariosDisponibles,
  registrarCliente,
  registrarPago,
  registrarRevision,
} from '@/lib/dataService';
import { ahoraBogota, sumarDias } from '@/lib/reglas/fechas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { DatosRegistroCliente } from '@/lib/dataService';

const cédulasPrueba: [string, string] = ['9999990001', '9999990002'];
const clientes: [{ id: string } | null, { id: string } | null] = [null, null];
let citaId: number | null = null;
let fallas = 0;
let preflightCorrecto = false;

const datosCliente = (cc: string): DatosRegistroCliente => ({
  cc,
  nombre: 'Cliente de prueba agenda',
  telefono: cc.endsWith('1') ? '3001110001' : '3001110002',
  correo: `${cc}@example.test`,
  aceptaTratamientoDatos: true,
});
const comprobar: (condicion: unknown, mensaje: string) => asserts condicion = (condicion, mensaje) => {
  if (!condicion) throw new Error(mensaje);
};

async function paso(numero: number, descripcion: string, accion: () => Promise<void>): Promise<void> {
  try {
    await accion();
    console.log(`OK    Paso ${numero} · ${descripcion}`);
  } catch (error) {
    fallas += 1;
    const detalle = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`FALLA Paso ${numero} · ${descripcion} · ${detalle}`);
  }
}

async function esperarError(
  accion: () => Promise<unknown>,
  codigos: string[],
): Promise<void> {
  try {
    await accion();
  } catch (error) {
    if (error instanceof ErrorDeNegocio && codigos.includes(error.codigo)) return;
    throw error;
  }
  throw new Error(`Se esperaba el error ${codigos.join(' o ')}.`);
}

try {
  const existentes = await pool.query<{ cantidad: number }>(
    'SELECT count(*)::int AS cantidad FROM clientes WHERE cc = ANY($1::varchar[])',
    [cédulasPrueba],
  );
  if ((existentes.rows[0]?.cantidad ?? 0) > 0) {
    throw new Error('Los identificadores de prueba ya existen; no se modificó ningún registro.');
  }
  preflightCorrecto = true;

  await paso(1, 'Registrar cliente 1', async () => {
    clientes[0] = await registrarCliente(datosCliente(cédulasPrueba[0]), 'contador');
    comprobar(!!clientes[0].id, 'No se recibió el identificador del cliente.');
  });
  await paso(2, 'Rechazar cédula duplicada', async () => {
    await esperarError(() => registrarCliente(datosCliente(cédulasPrueba[0]), 'contador'), ['CC_DUPLICADA']);
  });
  await paso(3, 'Agendar primera hora disponible', async () => {
    const cliente = clientes[0];
    comprobar(cliente !== null, 'No se creó el primer cliente.');
    let fecha = '';
    let hora = '';
    const hoy = ahoraBogota().fecha;
    for (let dia = 1; dia <= 30 && !hora; dia += 1) {
      fecha = sumarDias(hoy, dia);
      hora = (await obtenerHorariosDisponibles(fecha, 'contador'))[0] ?? '';
    }
    comprobar(!!hora, 'No hay horarios disponibles en los próximos 30 días.');
    const cita = await agendarCita({ clienteId: cliente.id, fecha, hora, origen: 'contador' });
    citaId = cita.citaId;
  });
  await paso(4, 'Rechazar cruce de horario', async () => {
    clientes[1] = await registrarCliente(datosCliente(cédulasPrueba[1]), 'contador');
    const clienteUno = clientes[0];
    const clienteDos = clientes[1];
    const idCita = citaId;
    comprobar(clienteUno !== null && clienteDos !== null && idCita !== null, 'Faltan datos de la prueba de agenda.');
    const detalle = await obtenerDetalleCliente(clienteUno.id);
    const cita = detalle.citas.find((elemento) => elemento.id === idCita);
    comprobar(cita, 'No se encontró la cita recién creada.');
    await esperarError(
      () => agendarCita({
        clienteId: clienteDos.id, fecha: cita.fecha, hora: cita.hora, origen: 'contador',
      }),
      ['CITA_CRUCE_HORARIO'],
    );
  });
  await paso(5, 'Rechazar segunda cita activa', async () => {
    const cliente = clientes[0];
    const idCita = citaId;
    comprobar(cliente !== null && idCita !== null, 'Faltan datos del primer cliente.');
    const detalle = await obtenerDetalleCliente(cliente.id);
    const cita = detalle.citas.find((elemento) => elemento.id === idCita);
    comprobar(cita, 'No se encontró la cita activa.');
    await esperarError(
      () => agendarCita({
        clienteId: cliente.id, fecha: cita.fecha, hora: cita.hora, origen: 'contador',
      }),
      ['CITA_ACTIVA_EXISTENTE', 'ACCION_NO_PERMITIDA_EN_ESTADO'],
    );
  });
  await paso(6, 'Rechazar revisión sin pago', async () => {
    const idCita = citaId;
    comprobar(idCita !== null, 'No se creó una cita.');
    await esperarError(
      () => registrarRevision({ citaId: idCita, resultado: 'debe_declarar' }),
      ['ACCION_NO_PERMITIDA_EN_ESTADO', 'PAGO_CONSULTA_REQUERIDO'],
    );
  });
  await paso(7, 'Registrar pago de consulta insuficiente', async () => {
    const cliente = clientes[0];
    const idCita = citaId;
    comprobar(cliente !== null && idCita !== null, 'Faltan datos de pago.');
    const pago = await registrarPago({
      clienteId: cliente.id, tipo: 'primera_consulta', citaId: idCita, monto: 49_000,
      metodo: 'efectivo', fechaPago: ahoraBogota().fecha,
    });
    comprobar(pago.estado === 'pendiente', 'El pago menor al valor esperado no quedó pendiente.');
  });
  await paso(8, 'Confirmar pago exacto de consulta', async () => {
    const cliente = clientes[0];
    const idCita = citaId;
    comprobar(cliente !== null && idCita !== null, 'Faltan datos de pago.');
    const pago = await registrarPago({
      clienteId: cliente.id, tipo: 'primera_consulta', citaId: idCita, monto: 50_000,
      metodo: 'transferencia', fechaPago: ahoraBogota().fecha,
    });
    comprobar(pago.estado === 'confirmado', 'El pago exacto no quedó confirmado.');
  });
  await paso(9, 'Registrar revisión y cerrar cita', async () => {
    const cliente = clientes[0];
    const idCita = citaId;
    comprobar(cliente !== null && idCita !== null, 'Faltan datos para la revisión.');
    await registrarRevision({ citaId: idCita, resultado: 'debe_declarar' });
    const detalle = await obtenerDetalleCliente(cliente.id);
    comprobar(detalle.cliente.estado === 'debe_declarar', 'El estado del trámite no se actualizó.');
    comprobar(detalle.citas[0]?.estadoCita === 'atendida', 'La cita no quedó atendida.');
  });
  await paso(10, 'Rechazar inicio sin pago de servicio', async () => {
    const cliente = clientes[0];
    comprobar(cliente !== null, 'No se creó el primer cliente.');
    await esperarError(() => iniciarTramite(cliente.id), ['TRAMITE_NO_HABILITADO']);
  });
  await paso(11, 'Registrar pago de servicio insuficiente', async () => {
    const cliente = clientes[0];
    comprobar(cliente !== null, 'No se creó el primer cliente.');
    const pago = await registrarPago({
      clienteId: cliente.id, tipo: 'servicio_completo', monto: 299_000,
      metodo: 'transferencia', fechaPago: ahoraBogota().fecha,
    });
    comprobar(pago.estado === 'pendiente', 'El pago insuficiente no quedó pendiente.');
  });
  await paso(12, 'Confirmar pago exacto del servicio', async () => {
    const cliente = clientes[0];
    comprobar(cliente !== null, 'No se creó el primer cliente.');
    const pago = await registrarPago({
      clienteId: cliente.id, tipo: 'servicio_completo', monto: 300_000,
      metodo: 'transferencia', fechaPago: ahoraBogota().fecha,
    });
    comprobar(pago.estado === 'confirmado', 'El pago exacto no quedó confirmado.');
  });
  await paso(13, 'Iniciar trámite habilitado', async () => {
    const cliente = clientes[0];
    comprobar(cliente !== null, 'No se creó el primer cliente.');
    await iniciarTramite(cliente.id);
    const detalle = await obtenerDetalleCliente(cliente.id);
    comprobar(detalle.cliente.estado === 'en_proceso', 'El trámite no quedó en proceso.');
  });
  await paso(14, 'Verificar detalle completo', async () => {
    const cliente = clientes[0];
    comprobar(cliente !== null, 'No se creó el primer cliente.');
    const detalle = await obtenerDetalleCliente(cliente.id);
    comprobar(detalle.citas.length === 1, 'El detalle no tiene una cita.');
    comprobar(detalle.pagos.length === 4, 'El detalle no tiene cuatro pagos.');
    comprobar(!!detalle.revision, 'El detalle no contiene una revisión.');
    comprobar(detalle.eventos.length >= 10, 'El historial no contiene los eventos esperados.');
  });
} catch (error) {
  fallas += 1;
  console.error(`FALLA Preparación · ${error instanceof Error ? error.message : 'Error desconocido'}`);
} finally {
  if (preflightCorrecto) {
    const limpieza = spawnSync(process.execPath, [
      '--env-file=.env.local', 'scripts/limpiar-cliente.mjs', ...cédulasPrueba,
    ], { stdio: 'inherit' });
    if (limpieza.status !== 0) {
      fallas += 1;
      console.error('FALLA Limpieza · No se pudieron borrar los registros de prueba.');
    }
  }
  await pool.end();
}

console.log(`Total de fallas: ${fallas}`);
if (fallas) process.exitCode = 1;
