import { ZONA_HORARIA } from '@/lib/config/negocio';

export type EstadoFecha = 'pendiente' | 'vence_hoy' | 'vencida' | 'sin_informacion';

function fechaUTC(fecha: string): number {
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const dia = Number(fecha.slice(8, 10));
  return Date.UTC(anio, mes - 1, dia);
}

export function ahoraBogota(reloj: Date = new Date()): { fecha: string; hora: string; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(reloj);
  const valor = (tipo: Intl.DateTimeFormatPartTypes): string => {
    const parte = partes.find((item) => item.type === tipo);
    if (!parte) throw new Error(`Falta la parte de fecha ${tipo}.`);
    return parte.value;
  };
  const fecha = `${valor('year')}-${valor('month')}-${valor('day')}`;
  const hora = `${valor('hour')}:${valor('minute')}`;
  return { fecha, hora, minutos: horaAMinutos(hora) };
}

export function diaSemanaISO(fecha: string): number {
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const dia = Number(fecha.slice(8, 10));
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return diaSemana === 0 ? 7 : diaSemana;
}

export function horaAMinutos(hora: string): number {
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

export function minutosAHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(fechaUTC(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

export function diasEntre(desde: string, hasta: string): number {
  return (fechaUTC(hasta) - fechaUTC(desde)) / 86_400_000;
}

export function estadoFechaLimite(
  hoy: string,
  fechaLimite: string | null,
): { estado: EstadoFecha; diasRestantes: number | null } {
  if (fechaLimite === null) return { estado: 'sin_informacion', diasRestantes: null };
  const diasRestantes = diasEntre(hoy, fechaLimite);
  if (diasRestantes > 0) return { estado: 'pendiente', diasRestantes };
  if (diasRestantes === 0) return { estado: 'vence_hoy', diasRestantes };
  return { estado: 'vencida', diasRestantes };
}
