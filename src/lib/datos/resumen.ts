import { consultar } from '@/lib/db/conexion';
import { ahoraBogota } from '@/lib/reglas/fechas';
import type { EstadoTramite } from '@/lib/reglas/estados';
import type { FilaCita, ResumenPanel } from '@/lib/datos/tipos';

const ESTADOS: EstadoTramite[] = [
  'registrado', 'cita_agendada', 'consulta_pagada', 'debe_declarar',
  'no_debe_declarar', 'servicio_pagado', 'en_proceso',
];

export async function obtenerResumen(): Promise<ResumenPanel> {
  const hoy = ahoraBogota().fecha;
  const [clientes, citas, pagos] = await Promise.all([
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
  ]);
  const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<EstadoTramite, number>;
  for (const fila of clientes) porEstado[fila.estado] = Number(fila.cantidad);
  const citasHoy: FilaCita[] = citas.map((c) => ({
    id: Number(c.id), clienteId: c.cliente_id, nombre: c.nombre, fecha: c.fecha,
    hora: c.hora, horaFin: c.hora_fin, valor: Number(c.valor),
    estadoCita: c.estado_cita, estadoPago: c.estado_pago,
  }));
  return {
    porEstado, citasHoy, pagosEnRevision: Number(pagos[0]?.cantidad ?? 0),
    totalClientes: Object.values(porEstado).reduce((total, cantidad) => total + cantidad, 0),
  };
}
