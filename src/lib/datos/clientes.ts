import { consultar, conTransaccion } from '@/lib/db/conexion';
import { ahoraBogota, estadoFechaLimite } from '@/lib/reglas/fechas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { coincidenUltimos4, enmascararCC } from '@/lib/reglas/privacidad';
import { accionesPermitidas, type EstadoTramite } from '@/lib/reglas/estados';
import type { CambiosCliente, DatosRegistroCliente, DetalleCliente, FilaCliente, ResultadoFechaLimite } from '@/lib/datos/tipos';
import { registrarEvento } from '@/lib/datos/eventos';
import { listarNotas } from '@/lib/datos/notas';

type ClienteFila = {
  id: string; cc: string; nombre: string; telefono: string; correo: string;
  estado: EstadoTramite; origen_registro: 'cliente' | 'contador'; created_at: string;
  fecha_limite_renta: string | null; fecha_limite_efectiva: string | null;
  origen_fecha_limite: 'manual' | 'calendario' | 'sin_informacion';
};

function mapearFecha(hoy: string, fechaLimite: string | null) {
  return estadoFechaLimite(hoy, fechaLimite);
}

export async function registrarCliente(
  datos: DatosRegistroCliente,
  origen: 'cliente' | 'contador',
): Promise<{ id: string }> {
  try {
    return await conTransaccion(async (tx) => {
      const resultado = await tx.query<{ id: string }>(
        `INSERT INTO clientes (cc, nombre, telefono, correo, acepta_tratamiento_datos, origen_registro)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [datos.cc, datos.nombre, datos.telefono, datos.correo, datos.aceptaTratamientoDatos, origen],
      );
      const cliente = resultado.rows[0];
      if (!cliente) throw new ErrorDeNegocio('ERROR_INTERNO');
      const id = cliente.id;
      await registrarEvento(tx, {
        clienteId: id, tipo: 'CLIENTE_REGISTRADO', actor: origen,
        detalle: { origenRegistro: origen },
      });
      return { id };
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new ErrorDeNegocio('CC_DUPLICADA');
    }
    throw error;
  }
}

export async function verificarCliente(cc: string, ultimos4: string): Promise<{ id: string; estado: EstadoTramite }> {
  const filas = await consultar<Pick<ClienteFila, 'id' | 'cc' | 'telefono' | 'estado'>>(
    'SELECT id, cc, telefono, estado FROM clientes WHERE cc = $1', [cc],
  );
  const cliente = filas[0];
  if (!cliente) throw new ErrorDeNegocio('DATOS_NO_COINCIDEN');
  if (!coincidenUltimos4(cliente.telefono, ultimos4)) throw new ErrorDeNegocio('DATOS_NO_COINCIDEN');
  return { id: cliente.id, estado: cliente.estado };
}

export async function obtenerContactoCliente(id: string): Promise<{ nombre: string; correo: string }> {
  const filas = await consultar<{ nombre: string; correo: string }>(
    'SELECT nombre, correo FROM clientes WHERE id = $1',
    [id],
  );
  const cliente = filas[0];
  if (!cliente) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
  return cliente;
}

export async function listarClientes(filtros: {
  busqueda?: string; estado?: EstadoTramite;
} = {}): Promise<FilaCliente[]> {
  const busqueda = filtros.busqueda?.trim();
  const filas = await consultar<ClienteFila>(
    `SELECT id, cc, nombre, telefono, estado, fecha_limite_efectiva, origen_fecha_limite,
            fecha_limite_renta
     FROM v_clientes_fecha
     WHERE ($1::text IS NULL OR nombre ILIKE '%' || $1 || '%' OR cc LIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR estado = $2)
     ORDER BY lower(nombre), id`,
    [busqueda || null, filtros.estado ?? null],
  );
  const hoy = ahoraBogota().fecha;
  return filas.map((fila) => {
    const fecha = mapearFecha(hoy, fila.fecha_limite_efectiva);
    return {
      id: fila.id, nombre: fila.nombre, ccEnmascarada: enmascararCC(fila.cc), telefono: fila.telefono,
      estado: fila.estado, fechaLimite: fila.fecha_limite_efectiva,
      estadoFecha: fecha.estado, diasRestantes: fecha.diasRestantes,
    };
  });
}

export async function obtenerDetalleCliente(id: string): Promise<DetalleCliente> {
  const [clientes, citas, pagos, revisiones, eventos, notas] = await Promise.all([
    consultar<ClienteFila>(
      `SELECT id, cc, nombre, telefono, correo, estado, origen_registro, created_at,
              fecha_limite_renta, fecha_limite_efectiva, origen_fecha_limite
       FROM v_clientes_fecha WHERE id = $1`, [id],
    ),
    consultar<{
      id: number; fecha: string; hora: string; hora_fin: string; valor: number;
      estado_cita: string; estado_pago: string; origen: string; motivo_cancelacion: string | null;
    }>(
      `SELECT id, to_char(inicio, 'YYYY-MM-DD') AS fecha, to_char(inicio, 'HH24:MI') AS hora,
              to_char(fin, 'HH24:MI') AS hora_fin, valor, estado_cita, estado_pago, origen, motivo_cancelacion
       FROM citas WHERE cliente_id = $1 ORDER BY inicio DESC`, [id],
    ),
    consultar<{
      id: number; tipo: 'primera_consulta' | 'servicio_completo'; cita_id: number | null;
      monto: number; valor_esperado: number; metodo: string; referencia: string | null;
      estado: 'pendiente' | 'confirmado' | 'requiere_revision' | 'anulado';
      fecha_pago: string; observacion: string | null;
    }>(
      `SELECT id, tipo, cita_id, monto, valor_esperado, metodo, referencia, estado,
              to_char(fecha_pago, 'YYYY-MM-DD') AS fecha_pago, observacion
       FROM pagos WHERE cliente_id = $1 ORDER BY fecha_pago DESC, id DESC`, [id],
    ),
    consultar<{
      id: number; cita_id: number; resultado: 'debe_declarar' | 'no_debe_declarar';
      observaciones: string | null; fecha_revision: string;
    }>(
      `SELECT id, cita_id, resultado, observaciones,
              to_char(fecha_revision, 'YYYY-MM-DD') AS fecha_revision
       FROM revisiones WHERE cliente_id = $1`, [id],
    ),
    consultar<{
      id: number; tipo: string; estado_anterior: string | null; estado_nuevo: string | null;
      actor: 'cliente' | 'contador' | 'sistema'; detalle: Record<string, unknown>; creado_en: string;
    }>(
      `SELECT id, tipo, estado_anterior, estado_nuevo, actor, detalle,
              to_char(created_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD HH24:MI') AS creado_en
       FROM eventos_cliente WHERE cliente_id = $1 ORDER BY created_at DESC LIMIT 100`, [id],
    ),
    listarNotas(id),
  ]);
  const cliente = clientes[0];
  if (!cliente) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
  const fecha = mapearFecha(ahoraBogota().fecha, cliente.fecha_limite_efectiva);
  const revision = revisiones[0];
  const tienePagoServicioConfirmado = pagos.some((p) => p.tipo === 'servicio_completo' && p.estado === 'confirmado');
  const puedeIniciar = cliente.estado === 'servicio_pagado'
    && revision?.resultado === 'debe_declarar' && tienePagoServicioConfirmado;
  return {
    cliente: {
      id: cliente.id, cc: cliente.cc, nombre: cliente.nombre, telefono: cliente.telefono,
      correo: cliente.correo, estado: cliente.estado, origenRegistro: cliente.origen_registro,
      creadoEn: cliente.created_at,
    },
    fecha: {
      fechaLimite: cliente.fecha_limite_efectiva, origen: cliente.origen_fecha_limite,
      estado: fecha.estado, diasRestantes: fecha.diasRestantes, fechaManual: cliente.fecha_limite_renta,
    },
    citas: citas.map((c) => ({
      id: Number(c.id), fecha: c.fecha, hora: c.hora, horaFin: c.hora_fin, valor: Number(c.valor),
      estadoCita: c.estado_cita, estadoPago: c.estado_pago, origen: c.origen,
      motivoCancelacion: c.motivo_cancelacion,
    })),
    pagos: pagos.map((p) => ({
      id: Number(p.id), tipo: p.tipo, citaId: p.cita_id === null ? null : Number(p.cita_id),
      monto: Number(p.monto), valorEsperado: Number(p.valor_esperado), metodo: p.metodo,
      referencia: p.referencia, estado: p.estado, fechaPago: p.fecha_pago, observacion: p.observacion,
    })),
    revision: revision ? {
      id: Number(revision.id), citaId: Number(revision.cita_id), resultado: revision.resultado,
      observaciones: revision.observaciones, fechaRevision: revision.fecha_revision,
    } : null,
    notas,
    eventos: eventos.map((e) => ({
      id: Number(e.id), tipo: e.tipo, estadoAnterior: e.estado_anterior, estadoNuevo: e.estado_nuevo,
      actor: e.actor, detalle: e.detalle, creadoEn: e.creado_en,
    })),
    acciones: accionesPermitidas(
      cliente.estado,
      citas.some((cita) => cita.estado_cita === 'agendada'),
    ),
    puedeIniciarTramite: puedeIniciar,
  };
}

export async function actualizarCliente(id: string, cambios: CambiosCliente): Promise<void> {
  const columnas: string[] = [];
  const valores: unknown[] = [id];
  const asignar = (columna: string, valor: unknown) => {
    valores.push(valor);
    columnas.push(`${columna} = $${valores.length}`);
  };
  if (cambios.nombre !== undefined) asignar('nombre', cambios.nombre);
  if (cambios.telefono !== undefined) asignar('telefono', cambios.telefono);
  if (cambios.correo !== undefined) asignar('correo', cambios.correo);
  if (cambios.fechaLimiteManual !== undefined) asignar('fecha_limite_renta', cambios.fechaLimiteManual);
  if (!columnas.length) return;
  await conTransaccion(async (tx) => {
    const cliente = await tx.query<{ id: string }>('SELECT id FROM clientes WHERE id = $1 FOR UPDATE', [id]);
    if (!cliente.rows.length) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
    await tx.query(`UPDATE clientes SET ${columnas.join(', ')} WHERE id = $1`, valores);
    await registrarEvento(tx, {
      clienteId: id, tipo: 'DATOS_ACTUALIZADOS', actor: 'contador',
      detalle: { camposActualizados: columnas.map((columna) => columna.split(' = ')[0]) },
    });
  });
}

export async function consultarFechaLimite(cc: string): Promise<ResultadoFechaLimite> {
  const [cliente] = await consultar<{ cc: string; fecha_limite_efectiva: string | null }>(
    'SELECT cc, fecha_limite_efectiva FROM v_clientes_fecha WHERE cc = $1', [cc],
  );
  if (!cliente) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
  return { fechaLimite: cliente.fecha_limite_efectiva, ...estadoFechaLimite(ahoraBogota().fecha, cliente.fecha_limite_efectiva) };
}
