import type { EstadoFecha } from '@/lib/reglas/fechas';

export function formatearPesos(monto: number): string {
  const valor = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(monto);
  return `$ ${valor}`;
}

export function formatearFechaLarga(fecha: string): string {
  const fechaUTC = new Date(`${fecha}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(fechaUTC);
}

export function formatearHora(hora: string): string {
  const [horasTexto, minutos] = hora.split(':');
  const horas = Number(horasTexto);
  const horas12 = horas % 12 || 12;
  const periodo = horas < 12 ? 'a. m.' : 'p. m.';
  return `${horas12}:${minutos} ${periodo}`;
}

export function textoDiasRestantes(estado: EstadoFecha, dias: number | null): string {
  if (estado === 'sin_informacion' || dias === null) return 'Sin fecha registrada';
  if (estado === 'vence_hoy') return 'Vence hoy';
  if (estado === 'vencida') {
    const diasVencidos = Math.abs(dias);
    return `Venció hace ${diasVencidos} ${diasVencidos === 1 ? 'día' : 'días'}`;
  }
  return dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`;
}
