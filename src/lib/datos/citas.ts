import { consultar, conTransaccion } from '@/lib/db/conexion';
import { DURACION_CITA_MINUTOS, TARIFA_PRIMERA_CONSULTA } from '@/lib/config/negocio';
import { calcularHorariosDisponibles, validarNuevaCita, type OrigenCita } from '@/lib/reglas/agenda';
import { ahoraBogota, minutosAHora, horaAMinutos } from '@/lib/reglas/fechas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { siguienteEstado } from '@/lib/reglas/estados';
import type { CitaResumen, FilaCita } from '@/lib/datos/tipos';
import { actualizarEstadoCliente, bloquearCliente, registrarEvento } from '@/lib/datos/eventos';

type Ocupada = { inicio: string; fin: string };
async function obtenerOcupadas(fecha: string): Promise<Ocupada[]> {
  return consultar<Ocupada>(
    `SELECT to_char(inicio, 'HH24:MI') AS inicio, to_char(fin, 'HH24:MI') AS fin
     FROM citas WHERE inicio::date = $1 AND estado_cita <> 'cancelada' ORDER BY inicio`,
    [fecha],
  );
}

export async function obtenerHorariosDisponibles(fecha: string, origen: OrigenCita): Promise<string[]> {
  return calcularHorariosDisponibles({ fecha, origen, ahora: ahoraBogota(), ocupadas: await obtenerOcupadas(fecha) });
}

export async function agendarCita(datos: {
  clienteId: string; fecha: string; hora: string; origen: OrigenCita;
}): Promise<{ citaId: number }> {
  try {
    return await conTransaccion(async (tx) => {
      const cliente = await bloquearCliente(tx, datos.clienteId);
      if (cliente.estado === 'cita_agendada') throw new ErrorDeNegocio('CITA_ACTIVA_EXISTENTE');
      if (cliente.estado !== 'registrado') throw new ErrorDeNegocio('ACCION_NO_PERMITIDA_EN_ESTADO');
      const activa = await tx.query<{ id: number }>(
        `SELECT id FROM citas WHERE cliente_id = $1 AND estado_cita = 'agendada'`, [datos.clienteId],
      );
      if (activa.rows.length) throw new ErrorDeNegocio('CITA_ACTIVA_EXISTENTE');
      const ocupadas = await tx.query<Ocupada>(
        `SELECT to_char(inicio, 'HH24:MI') AS inicio, to_char(fin, 'HH24:MI') AS fin
         FROM citas WHERE inicio::date = $1 AND estado_cita <> 'cancelada' FOR UPDATE`,
        [datos.fecha],
      );
      validarNuevaCita({ ...datos, ahora: ahoraBogota(), ocupadas: ocupadas.rows });
      const insertada = await tx.query<{ id: number }>(
        `INSERT INTO citas (cliente_id, inicio, valor, origen)
         VALUES ($1, $2::timestamp, $3, $4) RETURNING id`,
        [datos.clienteId, `${datos.fecha} ${datos.hora}:00`, TARIFA_PRIMERA_CONSULTA, datos.origen],
      );
      const citaInsertada = insertada.rows[0];
      if (!citaInsertada) throw new ErrorDeNegocio('ERROR_INTERNO');
      const estadoNuevo = siguienteEstado(cliente.estado, 'AGENDAR_CITA');
      await actualizarEstadoCliente(tx, cliente.id, estadoNuevo);
      await registrarEvento(tx, {
        clienteId: cliente.id, tipo: 'CITA_AGENDADA', anterior: cliente.estado, nuevo: estadoNuevo,
        actor: datos.origen, detalle: { citaId: Number(citaInsertada.id), fecha: datos.fecha, hora: datos.hora },
      });
      return { citaId: Number(citaInsertada.id) };
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if (error.code === '23P01') throw new ErrorDeNegocio('CITA_CRUCE_HORARIO');
      if (error.code === '23505') throw new ErrorDeNegocio('CITA_ACTIVA_EXISTENTE');
    }
    throw error;
  }
}

export async function reprogramarCita(citaId: number, fecha: string, hora: string): Promise<void> {
  try {
    await conTransaccion(async (tx) => {
      const resultado = await tx.query<{ cliente_id: string }>(
        'SELECT cliente_id FROM citas WHERE id = $1', [citaId],
      );
      const citaIdCliente = resultado.rows[0];
      if (!citaIdCliente) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
      await bloquearCliente(tx, citaIdCliente.cliente_id);
      const citaResultado = await tx.query<{
        cliente_id: string; estado_cita: string; inicio: string;
      }>('SELECT cliente_id, estado_cita, inicio::text AS inicio FROM citas WHERE id = $1 FOR UPDATE', [citaId]);
      const cita = citaResultado.rows[0];
      if (!cita) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
      if (cita.estado_cita !== 'agendada') throw new ErrorDeNegocio('CITA_NO_MODIFICABLE');
      const ocupadas = await tx.query<Ocupada>(
        `SELECT to_char(inicio, 'HH24:MI') AS inicio, to_char(fin, 'HH24:MI') AS fin
         FROM citas WHERE inicio::date = $1 AND estado_cita <> 'cancelada' AND id <> $2`,
        [fecha, citaId],
      );
      validarNuevaCita({ fecha, hora, origen: 'contador', ahora: ahoraBogota(), ocupadas: ocupadas.rows });
      await tx.query('UPDATE citas SET inicio = $2::timestamp WHERE id = $1', [citaId, `${fecha} ${hora}:00`]);
      await registrarEvento(tx, {
        clienteId: cita.cliente_id, tipo: 'CITA_REPROGRAMADA', actor: 'contador',
        detalle: { citaId, fechaAnterior: cita.inicio.slice(0, 10), horaAnterior: cita.inicio.slice(11, 16), fecha, hora },
      });
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23P01') {
      throw new ErrorDeNegocio('CITA_CRUCE_HORARIO');
    }
    throw error;
  }
}

export async function cancelarCita(
  citaId: number,
  motivo: string,
  actor: 'cliente' | 'contador',
): Promise<void> {
  await conTransaccion(async (tx) => {
    const referencia = await tx.query<{ cliente_id: string }>('SELECT cliente_id FROM citas WHERE id = $1', [citaId]);
    const clienteId = referencia.rows[0]?.cliente_id;
    if (!clienteId) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
    const cliente = await bloquearCliente(tx, clienteId);
    const resultado = await tx.query<{ estado_cita: string }>(
      'SELECT estado_cita FROM citas WHERE id = $1 FOR UPDATE', [citaId],
    );
    const cita = resultado.rows[0];
    if (!cita) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
    if (cita.estado_cita !== 'agendada') throw new ErrorDeNegocio('CITA_NO_MODIFICABLE');
    const pagos = await tx.query<{ id: number; estado: string }>(
      `SELECT id, estado FROM pagos WHERE cita_id = $1 AND estado <> 'anulado' FOR UPDATE`, [citaId],
    );
    if (pagos.rows.some((p) => p.estado === 'confirmado' || p.estado === 'requiere_revision')) {
      throw new ErrorDeNegocio('CITA_CON_PAGO');
    }
    for (const pago of pagos.rows) {
      await tx.query(
        `UPDATE pagos SET estado = 'anulado', observacion = 'Anulado por cancelación de la cita' WHERE id = $1`,
        [pago.id],
      );
      await registrarEvento(tx, {
        clienteId: cliente.id, tipo: 'PAGO_ANULADO', actor: 'sistema',
        detalle: { pagoId: Number(pago.id), motivo: 'Anulado por cancelación de la cita' },
      });
    }
    await tx.query(
      `UPDATE citas SET estado_cita = 'cancelada', motivo_cancelacion = $2 WHERE id = $1`,
      [citaId, motivo],
    );
    const estadoNuevo = siguienteEstado(cliente.estado, 'CANCELAR_CITA');
    await actualizarEstadoCliente(tx, cliente.id, estadoNuevo);
    await registrarEvento(tx, {
      clienteId: cliente.id, tipo: 'CITA_CANCELADA', anterior: cliente.estado, nuevo: estadoNuevo,
      actor, detalle: { citaId, motivo },
    });
  });
}

export async function obtenerCitaActiva(clienteId: string): Promise<CitaResumen | null> {
  const filas = await consultar<{
    id: number; fecha: string; hora: string; hora_fin: string; valor: number; estado_pago: string;
  }>(
    `SELECT id, to_char(inicio, 'YYYY-MM-DD') AS fecha, to_char(inicio, 'HH24:MI') AS hora,
            to_char(fin, 'HH24:MI') AS hora_fin, valor, estado_pago
     FROM citas WHERE cliente_id = $1 AND estado_cita = 'agendada'`, [clienteId],
  );
  const cita = filas[0];
  return cita ? {
    id: Number(cita.id), fecha: cita.fecha, hora: cita.hora, horaFin: cita.hora_fin,
    valor: Number(cita.valor), estadoPago: cita.estado_pago,
  } : null;
}

export async function listarCitas(desde: string, hasta: string): Promise<FilaCita[]> {
  const filas = await consultar<{
    id: number; cliente_id: string; nombre: string; fecha: string; hora: string; hora_fin: string;
    valor: number; estado_cita: string; estado_pago: string;
  }>(
    `SELECT c.id, c.cliente_id, cl.nombre, to_char(c.inicio, 'YYYY-MM-DD') AS fecha,
            to_char(c.inicio, 'HH24:MI') AS hora, to_char(c.fin, 'HH24:MI') AS hora_fin,
            c.valor, c.estado_cita, c.estado_pago
     FROM citas c JOIN clientes cl ON cl.id = c.cliente_id
     WHERE c.estado_cita <> 'cancelada'
       AND c.inicio >= $1::date AND c.inicio < ($2::date + INTERVAL '1 day')
     ORDER BY c.inicio`,
    [desde, hasta],
  );
  return filas.map((c) => ({
    id: Number(c.id), clienteId: c.cliente_id, nombre: c.nombre, fecha: c.fecha,
    hora: c.hora, horaFin: c.hora_fin, valor: Number(c.valor),
    estadoCita: c.estado_cita, estadoPago: c.estado_pago,
  }));
}

export function horarioFin(hora: string): string {
  return minutosAHora(horaAMinutos(hora) + DURACION_CITA_MINUTOS);
}
