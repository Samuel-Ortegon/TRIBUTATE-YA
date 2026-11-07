export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO' | 'CLIENTE_NO_ENCONTRADO' | 'DATOS_NO_COINCIDEN'
  | 'CC_DUPLICADA' | 'CITA_EN_PASADO' | 'FECHA_FUERA_DE_RANGO' | 'FUERA_DE_HORARIO'
  | 'ANTICIPACION_INSUFICIENTE' | 'CITA_CRUCE_HORARIO' | 'CITA_ACTIVA_EXISTENTE'
  | 'CITA_NO_ENCONTRADA' | 'CITA_NO_MODIFICABLE' | 'CITA_CON_PAGO'
  | 'ACCION_NO_PERMITIDA_EN_ESTADO' | 'PAGO_CONSULTA_REQUERIDO' | 'PAGO_SERVICIO_NO_DISPONIBLE'
  | 'PAGO_YA_CONFIRMADO' | 'PAGO_NO_ENCONTRADO' | 'PAGO_NO_MODIFICABLE' | 'OBSERVACION_REQUERIDA'
  | 'REVISION_EXISTENTE' | 'REVISION_NO_ENCONTRADA' | 'REVISION_NO_CORREGIBLE'
  | 'TRAMITE_NO_HABILITADO' | 'RANGO_INVALIDO' | 'RANGO_SOLAPADO' | 'ERROR_INTERNO';

export const MENSAJES: Record<CodigoError, string> = {
  DATOS_INVALIDOS: 'Revise los datos ingresados.',
  NO_AUTORIZADO: 'Debe iniciar sesión como contador.',
  CLIENTE_NO_ENCONTRADO: 'No hay información registrada para esta cédula.',
  DATOS_NO_COINCIDEN: 'No encontramos un registro con esos datos.',
  CC_DUPLICADA: 'Esta cédula ya está registrada.',
  CITA_EN_PASADO: 'No es posible agendar en una fecha u hora que ya pasó.',
  FECHA_FUERA_DE_RANGO: 'Solo se puede agendar dentro de los próximos 30 días.',
  FUERA_DE_HORARIO: 'La cita debe quedar dentro del horario de atención.',
  ANTICIPACION_INSUFICIENTE: 'Las citas se agendan con al menos 2 horas de anticipación.',
  CITA_CRUCE_HORARIO: 'Ese horario se cruza con otra cita.',
  CITA_ACTIVA_EXISTENTE: 'Ya existe una cita activa. Cancélela o finalícela antes de solicitar otra.',
  CITA_NO_ENCONTRADA: 'La cita no existe.',
  CITA_NO_MODIFICABLE: 'La cita ya fue atendida o cancelada.',
  CITA_CON_PAGO: 'La cita tiene un pago confirmado o en revisión; reprográmela en lugar de cancelarla.',
  ACCION_NO_PERMITIDA_EN_ESTADO: 'Esta acción no está disponible en el estado actual del trámite.',
  PAGO_CONSULTA_REQUERIDO: 'La revisión requiere el pago confirmado de la primera consulta.',
  PAGO_SERVICIO_NO_DISPONIBLE: 'El pago del servicio solo procede cuando el resultado es "Debe declarar".',
  PAGO_YA_CONFIRMADO: 'Ya existe un pago confirmado para este concepto.',
  PAGO_NO_ENCONTRADO: 'El pago no existe.',
  PAGO_NO_MODIFICABLE: 'Este pago no se puede aprobar ni anular en su estado actual.',
  OBSERVACION_REQUERIDA: 'Escriba una observación de al menos 10 caracteres.',
  REVISION_EXISTENTE: 'Este cliente ya tiene una revisión registrada.',
  REVISION_NO_ENCONTRADA: 'La revisión no existe.',
  REVISION_NO_CORREGIBLE: 'La revisión no se puede corregir: existen pagos del servicio sin anular o el trámite ya avanzó.',
  TRAMITE_NO_HABILITADO: 'El trámite solo inicia con resultado "Debe declarar" y el pago del servicio confirmado.',
  RANGO_INVALIDO: 'El rango de dígitos no es válido.',
  RANGO_SOLAPADO: 'El rango se cruza con otro del mismo año gravable.',
  ERROR_INTERNO: 'Ocurrió un error inesperado. Intente de nuevo.',
};

export const ESTADO_HTTP: Record<CodigoError, number> = {
  DATOS_INVALIDOS: 400,
  NO_AUTORIZADO: 401,
  CLIENTE_NO_ENCONTRADO: 404,
  DATOS_NO_COINCIDEN: 404,
  CC_DUPLICADA: 409,
  CITA_EN_PASADO: 422,
  FECHA_FUERA_DE_RANGO: 422,
  FUERA_DE_HORARIO: 422,
  ANTICIPACION_INSUFICIENTE: 422,
  CITA_CRUCE_HORARIO: 409,
  CITA_ACTIVA_EXISTENTE: 409,
  CITA_NO_ENCONTRADA: 404,
  CITA_NO_MODIFICABLE: 409,
  CITA_CON_PAGO: 409,
  ACCION_NO_PERMITIDA_EN_ESTADO: 409,
  PAGO_CONSULTA_REQUERIDO: 409,
  PAGO_SERVICIO_NO_DISPONIBLE: 409,
  PAGO_YA_CONFIRMADO: 409,
  PAGO_NO_ENCONTRADO: 404,
  PAGO_NO_MODIFICABLE: 409,
  OBSERVACION_REQUERIDA: 400,
  REVISION_EXISTENTE: 409,
  REVISION_NO_ENCONTRADA: 404,
  REVISION_NO_CORREGIBLE: 409,
  TRAMITE_NO_HABILITADO: 409,
  RANGO_INVALIDO: 400,
  RANGO_SOLAPADO: 409,
  ERROR_INTERNO: 500,
};

export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown) {
    super(mensaje ?? MENSAJES[codigo]);
    this.name = 'ErrorDeNegocio';
  }
}
