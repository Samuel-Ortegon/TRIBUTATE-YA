import { ErrorDeNegocio } from '@/lib/reglas/errores';

export type EstadoTramite = 'registrado' | 'cita_agendada' | 'consulta_pagada'
  | 'debe_declarar' | 'no_debe_declarar' | 'servicio_pagado' | 'en_proceso';
export type ResultadoRevision = 'debe_declarar' | 'no_debe_declarar';
export type EventoTramite = 'AGENDAR_CITA' | 'CANCELAR_CITA' | 'CONFIRMAR_PAGO_CONSULTA'
  | 'REVISION_DEBE_DECLARAR' | 'REVISION_NO_DEBE_DECLARAR'
  | 'CORRECCION_A_DEBE_DECLARAR' | 'CORRECCION_A_NO_DEBE_DECLARAR'
  | 'CONFIRMAR_PAGO_SERVICIO' | 'INICIAR_TRAMITE';
export type AccionContador = 'EDITAR_DATOS' | 'AGENDAR_CITA' | 'REPROGRAMAR_CITA' | 'CANCELAR_CITA'
  | 'REGISTRAR_PAGO_CONSULTA' | 'REGISTRAR_REVISION' | 'CORREGIR_REVISION'
  | 'REGISTRAR_PAGO_SERVICIO' | 'INICIAR_TRAMITE';

export const ETIQUETA_ESTADO: Record<EstadoTramite, string> = {
  registrado: 'Registrado',
  cita_agendada: 'Cita agendada',
  consulta_pagada: 'Primera consulta pagada',
  debe_declarar: 'Debe declarar',
  no_debe_declarar: 'No debe declarar (cerrado)',
  servicio_pagado: 'Servicio pagado',
  en_proceso: 'En proceso',
};

export const TRANSICIONES: Record<EstadoTramite, Partial<Record<EventoTramite, EstadoTramite>>> = {
  registrado: { AGENDAR_CITA: 'cita_agendada' },
  cita_agendada: {
    CANCELAR_CITA: 'registrado',
    CONFIRMAR_PAGO_CONSULTA: 'consulta_pagada',
  },
  consulta_pagada: {
    REVISION_DEBE_DECLARAR: 'debe_declarar',
    REVISION_NO_DEBE_DECLARAR: 'no_debe_declarar',
  },
  debe_declarar: {
    CORRECCION_A_NO_DEBE_DECLARAR: 'no_debe_declarar',
    CONFIRMAR_PAGO_SERVICIO: 'servicio_pagado',
  },
  no_debe_declarar: { CORRECCION_A_DEBE_DECLARAR: 'debe_declarar' },
  servicio_pagado: { INICIAR_TRAMITE: 'en_proceso' },
  en_proceso: {},
};

const ACCIONES_POR_ESTADO: Record<EstadoTramite, AccionContador[]> = {
  registrado: ['EDITAR_DATOS', 'AGENDAR_CITA'],
  cita_agendada: ['EDITAR_DATOS', 'REGISTRAR_PAGO_CONSULTA', 'REPROGRAMAR_CITA', 'CANCELAR_CITA'],
  consulta_pagada: ['EDITAR_DATOS', 'REGISTRAR_REVISION', 'REPROGRAMAR_CITA'],
  debe_declarar: ['EDITAR_DATOS', 'REGISTRAR_PAGO_SERVICIO', 'CORREGIR_REVISION'],
  no_debe_declarar: ['EDITAR_DATOS', 'CORREGIR_REVISION'],
  servicio_pagado: ['EDITAR_DATOS', 'INICIAR_TRAMITE'],
  en_proceso: ['EDITAR_DATOS'],
};

export function siguienteEstado(actual: EstadoTramite, evento: EventoTramite): EstadoTramite {
  const siguiente = TRANSICIONES[actual][evento];
  if (!siguiente) throw new ErrorDeNegocio('ACCION_NO_PERMITIDA_EN_ESTADO');
  return siguiente;
}

export function accionesPermitidas(estado: EstadoTramite, tieneCitaActiva = false): AccionContador[] {
  const acciones = [...ACCIONES_POR_ESTADO[estado]];
  if (tieneCitaActiva && !acciones.includes('REPROGRAMAR_CITA')) {
    acciones.push('REPROGRAMAR_CITA');
  }
  return acciones;
}

export function puedeIniciarTramite(d: {
  estado: EstadoTramite;
  resultadoRevision: ResultadoRevision | null;
  tienePagoServicioConfirmado: boolean;
}): boolean {
  return d.estado === 'servicio_pagado'
    && d.resultadoRevision === 'debe_declarar'
    && d.tienePagoServicioConfirmado;
}
