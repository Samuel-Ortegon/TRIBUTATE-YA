import { consultar } from '@/lib/db/conexion';
import { DIAS_ALERTA_FECHA_PROXIMA } from '@/lib/config/negocio';
import { ahoraBogota, estadoFechaLimite, sumarDias } from '@/lib/reglas/fechas';
import type { EstadoTramite } from '@/lib/reglas/estados';
import type { FechaProxima, FilaCita, ResumenPanel } from '@/lib/datos/tipos';

const ESTADOS: EstadoTramite[] = [
  'registrado', 'cita_agendada', 'consulta_pagada', 'debe_declarar',
  'no_debe_declarar', 'servicio_pagado', 'en_proceso',
];

export async function obtenerResumen(): Promise<ResumenPanel> {
  const hoy = ahoraBogota().fecha;
  const [clientes, citas, pagos, fechas] = await Promise.all([
    consultar<{ estado: EstadoTramite; cantidad: number }>(
      'SELECT estado, count(*)::int AS cantidad FROM clientes GROUP BY estado',
    ),
    consultar<{
      id: number; cliente_id: string; nombre: string; fecha: string; hora: string; hora_fin: string;
      valor: number; estado_cita: string; estado_pago: string;
    }>(
      `SELECT c.id, c.cliente_id, cl.nombre, to_char(c.inicio, 'YYYY-MM-DD') AS fecha,
              to_char(c.inicio, 'HH24:MI') AS hora, to_char(c.fin, 'HH24:MI') AS hora_fin,
              c.valor, c.estado_cita, c.estado_pago
       FROM citas c JOIN clientes cl ON cl.id = c.cliente_id
       WHERE c.inicio::date = $1 AND c.estado_cita <> 'cancelada'
       ORDER BY c.inicio`, [hoy],
    ),
    consultar<{ cantidad: number }>(
      `SELECT count(*)::int AS cantidad FROM pagos WHERE estado = 'requiere_revision'`,
    ),
    consultar<{
      id: string; nombre: string; estado: EstadoTramite; fecha_limite: string; dias_restantes: number;
    }>(
      `SELECT id, nombre, estado, to_char(fecha_limite_efectiva, 'YYYY-MM-DD') AS fecha_limite,
              (fecha_limite_efectiva - $1::date)::int AS dias_restantes
       FROM v_clientes_fecha
       WHERE fecha_limite_efectiva BETWEEN $1::date AND $2::date
         AND estado NOT IN ('no_debe_declarar', 'en_proceso')
       ORDER BY fecha_limite_efectiva, lower(nombre), id`,
      [hoy, sumarDias(hoy, DIAS_ALERTA_FECHA_PROXIMA)],
    ),
  ]);
  const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<EstadoTramite, number>;
  for (const fila of clientes) porEstado[fila.estado] = Number(fila.cantidad);
  const citasHoy: FilaCita[] = citas.map((c) => ({
    id: Number(c.id), clienteId: c.cliente_id, nombre: c.nombre, fecha: c.fecha,
    hora: c.hora, horaFin: c.hora_fin, valor: Number(c.valor),
    estadoCita: c.estado_cita, estadoPago: c.estado_pago,
  }));
  const fechasProximas: FechaProxima[] = fechas.map((fila) => {
    const estadoFecha = estadoFechaLimite(hoy, fila.fecha_limite);
    return {
      id: fila.id,
      nombre: fila.nombre,
      estado: fila.estado,
      fechaLimite: fila.fecha_limite,
      estadoFecha: estadoFecha.estado,
      diasRestantes: estadoFecha.diasRestantes,
    };
  });
  return {
    porEstado, citasHoy, pagosEnRevision: Number(pagos[0]?.cantidad ?? 0),
    totalClientes: Object.values(porEstado).reduce((total, cantidad) => total + cantidad, 0),
    fechasProximas,
  };
}
