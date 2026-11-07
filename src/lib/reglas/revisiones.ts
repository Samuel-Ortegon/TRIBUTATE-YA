import { LONGITUD_MINIMA_OBSERVACION } from '@/lib/config/negocio';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { EstadoTramite, EventoTramite, ResultadoRevision } from '@/lib/reglas/estados';

export function validarRegistroRevision(d: {
  estadoCliente: EstadoTramite;
  citaPagada: boolean;
  existeRevision: boolean;
}): void {
  if (d.estadoCliente !== 'consulta_pagada') {
    throw new ErrorDeNegocio('ACCION_NO_PERMITIDA_EN_ESTADO');
  }
  if (!d.citaPagada) throw new ErrorDeNegocio('PAGO_CONSULTA_REQUERIDO');
  if (d.existeRevision) throw new ErrorDeNegocio('REVISION_EXISTENTE');
}

export function validarCorreccionRevision(d: {
  estadoCliente: EstadoTramite;
  resultadoActual: ResultadoRevision;
  resultadoNuevo: ResultadoRevision;
  pagosServicioNoAnulados: number;
  motivo: string;
}): EventoTramite {
  if (d.estadoCliente !== 'debe_declarar' && d.estadoCliente !== 'no_debe_declarar') {
    throw new ErrorDeNegocio('REVISION_NO_CORREGIBLE');
  }
  if (d.pagosServicioNoAnulados > 0) throw new ErrorDeNegocio('REVISION_NO_CORREGIBLE');
  if (d.resultadoNuevo === d.resultadoActual) throw new ErrorDeNegocio('DATOS_INVALIDOS');
  if (d.motivo.trim().length < LONGITUD_MINIMA_OBSERVACION) {
    throw new ErrorDeNegocio('OBSERVACION_REQUERIDA');
  }
  return d.resultadoNuevo === 'debe_declarar'
    ? 'CORRECCION_A_DEBE_DECLARAR'
    : 'CORRECCION_A_NO_DEBE_DECLARAR';
}
