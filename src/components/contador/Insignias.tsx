import { ETIQUETA_ESTADO, type EstadoTramite } from '@/lib/reglas/estados';
import type { EstadoFecha } from '@/lib/reglas/fechas';
import { textoDiasRestantes } from '@/lib/formato';

const tonoEstado: Record<EstadoTramite, string> = {
  registrado: 'neutral', cita_agendada: 'info', consulta_pagada: 'primary',
  debe_declarar: 'warning', no_debe_declarar: 'neutral', servicio_pagado: 'success', en_proceso: 'success',
};
export function InsigniaEstado({ estado }: { estado: EstadoTramite }) {
  return <span className={`badge badge-${tonoEstado[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>;
}
export function InsigniaFecha({ estado, dias }: { estado: EstadoFecha; dias: number | null }) {
  const tono = estado === 'vencida' ? 'danger' : estado === 'vence_hoy' ? 'warning' : estado === 'pendiente' ? 'info' : 'neutral';
  return <span className={`badge badge-${tono}`}>{textoDiasRestantes(estado, dias)}</span>;
}
