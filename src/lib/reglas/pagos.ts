import { LONGITUD_MINIMA_OBSERVACION, TARIFA_PRIMERA_CONSULTA, TARIFA_SERVICIO_COMPLETO } from '@/lib/config/negocio';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { EstadoTramite } from '@/lib/reglas/estados';

export type TipoPago = 'primera_consulta' | 'servicio_completo';
export type EstadoPago = 'pendiente' | 'confirmado' | 'requiere_revision' | 'anulado';

export function valorEsperado(tipo: TipoPago): number {
  return tipo === 'primera_consulta' ? TARIFA_PRIMERA_CONSULTA : TARIFA_SERVICIO_COMPLETO;
}

export function evaluarMonto(
  monto: number,
  esperado: number,
): 'pendiente' | 'confirmado' | 'requiere_revision' {
  if (monto < esperado) return 'pendiente';
  if (monto === esperado) return 'confirmado';
  return 'requiere_revision';
}

export function validarRegistroPago(d: {
  tipo: TipoPago;
  estadoCliente: EstadoTramite;
  cita: { estadoCita: 'agendada' | 'atendida' | 'cancelada'; estadoPago: 'pendiente' | 'pagada' } | null;
  existeConfirmado: boolean;
}): void {
  if (d.tipo === 'primera_consulta'
    && (d.estadoCliente !== 'cita_agendada'
      || d.cita?.estadoCita !== 'agendada'
      || d.cita.estadoPago !== 'pendiente')) {
    throw new ErrorDeNegocio('ACCION_NO_PERMITIDA_EN_ESTADO');
  }
  if (d.tipo === 'servicio_completo' && d.estadoCliente !== 'debe_declarar') {
    throw new ErrorDeNegocio('PAGO_SERVICIO_NO_DISPONIBLE');
  }
  if (d.existeConfirmado) throw new ErrorDeNegocio('PAGO_YA_CONFIRMADO');
}

export function validarResolucionPago(d: {
  estadoPago: EstadoPago;
  decision: 'aprobar' | 'anular';
  observacion: string;
}): void {
  const modificable = d.decision === 'aprobar'
    ? d.estadoPago === 'requiere_revision'
    : d.estadoPago === 'pendiente' || d.estadoPago === 'requiere_revision';
  if (!modificable) throw new ErrorDeNegocio('PAGO_NO_MODIFICABLE');
  if (d.observacion.trim().length < LONGITUD_MINIMA_OBSERVACION) {
    throw new ErrorDeNegocio('OBSERVACION_REQUERIDA');
  }
}
