import { z } from 'zod';

export const esquemaCC = z.string()
  .regex(/^[0-9]{6,10}$/, 'La cédula debe tener entre 6 y 10 dígitos, sin espacios.');

export const esquemaTelefono = z.string()
  .regex(/^(3[0-9]{9}|60[0-9]{8})$/, 'Ingrese un teléfono móvil o fijo válido de Colombia.');

export const esquemaUltimos4 = z.string()
  .regex(/^[0-9]{4}$/, 'Ingrese los últimos cuatro dígitos del teléfono.');

export const esquemaFecha = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD.')
  .refine((fecha) => {
    const anio = Number(fecha.slice(0, 4));
    const mes = Number(fecha.slice(5, 7));
    const dia = Number(fecha.slice(8, 10));
    const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
    return fechaUTC.getUTCFullYear() === anio
      && fechaUTC.getUTCMonth() === mes - 1
      && fechaUTC.getUTCDate() === dia;
  }, 'Ingrese una fecha real.');

export const esquemaHora = z.string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'La hora debe tener el formato HH:MM.');

const esquemaNombre = z.string()
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres.')
  .max(120, 'El nombre no puede superar 120 caracteres.');

const esquemaCorreo = z.email({ error: 'Ingrese un correo electrónico válido.' })
  .max(160, 'El correo no puede superar 160 caracteres.');

const esquemaResultado = z.enum(['debe_declarar', 'no_debe_declarar'], {
  error: 'Seleccione un resultado válido.',
});

export const esquemaRegistroCliente = z.object({
  cc: esquemaCC,
  nombre: esquemaNombre,
  telefono: esquemaTelefono,
  correo: esquemaCorreo,
  aceptaTratamientoDatos: z.literal(true, { error: 'Debe autorizar el tratamiento de datos personales.' }),
});

export const esquemaCambiosCliente = z.object({
  nombre: esquemaNombre.optional(),
  telefono: esquemaTelefono.optional(),
  correo: esquemaCorreo.optional(),
  fechaLimiteManual: esquemaFecha.nullable().optional(),
});

export const esquemaAgendarPublico = z.object({
  cc: esquemaCC,
  ultimos4: esquemaUltimos4,
  fecha: esquemaFecha,
  hora: esquemaHora,
});

export const esquemaAgendarContador = z.object({
  clienteId: z.uuid({ error: 'El identificador del cliente no es válido.' }),
  fecha: esquemaFecha,
  hora: esquemaHora,
});

export const esquemaPago = z.object({
  clienteId: z.uuid({ error: 'El identificador del cliente no es válido.' }),
  tipo: z.enum(['primera_consulta', 'servicio_completo'], { error: 'Seleccione un tipo de pago válido.' }),
  citaId: z.number().int('El identificador de la cita debe ser entero.').positive().optional(),
  monto: z.number().int('El monto debe expresarse en pesos enteros.')
    .positive('El monto debe ser mayor que cero.'),
  metodo: z.enum(['efectivo', 'transferencia', 'nequi', 'daviplata', 'otro'], {
    error: 'Seleccione un método de pago válido.',
  }),
  referencia: z.string().max(80, 'La referencia no puede superar 80 caracteres.').optional(),
  fechaPago: esquemaFecha,
}).superRefine((pago, contexto) => {
  if (pago.tipo === 'primera_consulta' && pago.citaId === undefined) {
    contexto.addIssue({
      code: 'custom',
      path: ['citaId'],
      message: 'La primera consulta debe estar asociada a una cita.',
    });
  }
  if (pago.tipo === 'servicio_completo' && pago.citaId !== undefined) {
    contexto.addIssue({
      code: 'custom',
      path: ['citaId'],
      message: 'El pago del servicio completo no se asocia a una cita.',
    });
  }
});

export const esquemaObservacion = z.string()
  .trim()
  .min(10, 'La observación debe tener al menos 10 caracteres.');

export const esquemaRevision = z.object({
  citaId: z.number().int('El identificador de la cita debe ser entero.'),
  resultado: esquemaResultado,
  observaciones: z.string().max(2000, 'Las observaciones no pueden superar 2000 caracteres.').optional(),
});

export const esquemaCorreccion = z.object({
  resultado: esquemaResultado,
  motivo: esquemaObservacion,
});

export const esquemaRango = z.object({
  anioGravable: z.number().int('El año gravable debe ser entero.')
    .min(2020, 'El año gravable no puede ser anterior a 2020.')
    .max(2100, 'El año gravable no puede superar 2100.'),
  digitoDesde: z.number().int('El dígito debe ser entero.')
    .min(0, 'El dígito mínimo es 0.')
    .max(99, 'El dígito máximo es 99.'),
  digitoHasta: z.number().int('El dígito debe ser entero.')
    .min(0, 'El dígito mínimo es 0.')
    .max(99, 'El dígito máximo es 99.'),
  fechaLimite: esquemaFecha,
}).refine((rango) => rango.digitoDesde <= rango.digitoHasta, {
  path: ['digitoHasta'],
  message: 'El dígito inicial no puede superar el dígito final.',
});

export const esquemaConsultaFechaLimite = z.object({ cc: esquemaCC });
export const esquemaVerificacionCliente = z.object({ cc: esquemaCC, ultimos4: esquemaUltimos4 });
export const esquemaAgendarContadorBody = esquemaAgendarContador;
export const esquemaCancelarCita = z.object({ motivo: z.string().trim().max(500).optional() });
export const esquemaObservacionBody = z.object({ observacion: esquemaObservacion });
export const esquemaMotivoBody = z.object({ motivo: esquemaObservacion });
export const esquemaReprogramarCita = z.object({ fecha: esquemaFecha, hora: esquemaHora });
export const esquemaFechasCitas = z.object({
  desde: esquemaFecha,
  hasta: esquemaFecha,
}).refine((rango) => {
  const desde = Date.UTC(Number(rango.desde.slice(0, 4)), Number(rango.desde.slice(5, 7)) - 1, Number(rango.desde.slice(8, 10)));
  const hasta = Date.UTC(Number(rango.hasta.slice(0, 4)), Number(rango.hasta.slice(5, 7)) - 1, Number(rango.hasta.slice(8, 10)));
  return hasta >= desde && (hasta - desde) / 86_400_000 <= 30;
}, { message: 'El rango de citas debe ser válido y no superar 31 días.' });
export const esquemaFechaQuery = z.object({ fecha: esquemaFecha });
export const esquemaIdNumerico = z.coerce.number().int().positive();
export const esquemaEstadoCliente = z.enum([
  'registrado', 'cita_agendada', 'consulta_pagada', 'debe_declarar',
  'no_debe_declarar', 'servicio_pagado', 'en_proceso',
]);

export type RegistroCliente = z.infer<typeof esquemaRegistroCliente>;
export type CambiosCliente = z.infer<typeof esquemaCambiosCliente>;
export type AgendarPublico = z.infer<typeof esquemaAgendarPublico>;
export type AgendarContador = z.infer<typeof esquemaAgendarContador>;
export type Pago = z.infer<typeof esquemaPago>;
export type Observacion = z.infer<typeof esquemaObservacion>;
export type Revision = z.infer<typeof esquemaRevision>;
export type Correccion = z.infer<typeof esquemaCorreccion>;
export type Rango = z.infer<typeof esquemaRango>;
