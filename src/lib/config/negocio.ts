export const TARIFA_PRIMERA_CONSULTA = 50_000;
export const TARIFA_SERVICIO_COMPLETO = 300_000;
export const DURACION_CITA_MINUTOS = 30;
export const ZONA_HORARIA = 'America/Bogota';

export const HORARIO_ATENCION: Record<number, Array<[string, string]>> = {
  1: [['08:00', '12:00'], ['14:00', '18:00']],
  2: [['08:00', '12:00'], ['14:00', '18:00']],
  3: [['08:00', '12:00'], ['14:00', '18:00']],
  4: [['08:00', '12:00'], ['14:00', '18:00']],
  5: [['08:00', '12:00'], ['14:00', '18:00']],
};

export const ANTICIPACION_MINIMA_CLIENTE_MINUTOS = 120;
export const DIAS_MAXIMOS_AGENDA = 30;
export const DIAS_ALERTA_FECHA_PROXIMA = 15;
export const LONGITUD_MINIMA_OBSERVACION = 10;
export const INSTRUCCIONES_PAGO =
  'El pago de la primera consulta se realiza por transferencia, Nequi o en efectivo. ' +
  'El contador lo confirma en el sistema antes de la cita.';
