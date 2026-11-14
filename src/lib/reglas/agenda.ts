import {
  ANTICIPACION_MINIMA_CLIENTE_MINUTOS,
  DIAS_MAXIMOS_AGENDA,
  DURACION_CITA_MINUTOS,
  HORARIO_ATENCION,
} from '@/lib/config/negocio';
import { diasEntre, diaSemanaISO, horaAMinutos, minutosAHora } from '@/lib/reglas/fechas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export type OrigenCita = 'cliente' | 'contador';
export interface CitaOcupada { inicio: string; fin: string }
export interface Ahora { fecha: string; minutos: number }

export function seCruzan(a: { inicio: number; fin: number }, b: { inicio: number; fin: number }): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

export function validarReprogramacionCita(d: {
  estadoCita: 'agendada' | 'atendida' | 'cancelada';
  tienePagoProtegido: boolean;
  origen: OrigenCita;
}): void {
  if (d.estadoCita !== 'agendada') throw new ErrorDeNegocio('CITA_NO_MODIFICABLE');
  if (d.origen === 'cliente' && !d.tienePagoProtegido) {
    throw new ErrorDeNegocio('CITA_SIN_PAGO');
  }
}

export function estaDentroDelHorario(fecha: string, hora: string): boolean {
  const bloques = HORARIO_ATENCION[diaSemanaISO(fecha)] ?? [];
  const inicio = horaAMinutos(hora);
  const fin = inicio + DURACION_CITA_MINUTOS;
  return bloques.some(([desde, hasta]) =>
    inicio >= horaAMinutos(desde) && fin <= horaAMinutos(hasta));
}

export function validarNuevaCita(d: {
  fecha: string;
  hora: string;
  ahora: Ahora;
  ocupadas: CitaOcupada[];
  origen: OrigenCita;
}): void {
  const diferenciaDias = diasEntre(d.ahora.fecha, d.fecha);
  const inicio = horaAMinutos(d.hora);
  if (diferenciaDias < 0 || (diferenciaDias === 0 && inicio < d.ahora.minutos)) {
    throw new ErrorDeNegocio('CITA_EN_PASADO');
  }
  if (diferenciaDias > DIAS_MAXIMOS_AGENDA) {
    throw new ErrorDeNegocio('FECHA_FUERA_DE_RANGO');
  }
  if (!estaDentroDelHorario(d.fecha, d.hora)) {
    throw new ErrorDeNegocio('FUERA_DE_HORARIO');
  }
  const minutosHastaCita = diferenciaDias * 24 * 60 + inicio - d.ahora.minutos;
  if (d.origen === 'cliente' && minutosHastaCita < ANTICIPACION_MINIMA_CLIENTE_MINUTOS) {
    throw new ErrorDeNegocio('ANTICIPACION_INSUFICIENTE');
  }
  const nueva = { inicio, fin: inicio + DURACION_CITA_MINUTOS };
  if (d.ocupadas.some((cita) => seCruzan(nueva, {
    inicio: horaAMinutos(cita.inicio),
    fin: horaAMinutos(cita.fin),
  }))) {
    throw new ErrorDeNegocio('CITA_CRUCE_HORARIO');
  }
}

export function calcularHorariosDisponibles(d: {
  fecha: string;
  ahora: Ahora;
  ocupadas: CitaOcupada[];
  origen: OrigenCita;
}): string[] {
  const horarios: string[] = [];
  const bloques = HORARIO_ATENCION[diaSemanaISO(d.fecha)] ?? [];
  for (const [desde, hasta] of bloques) {
    const inicioBloque = horaAMinutos(desde);
    const finBloque = horaAMinutos(hasta);
    for (let inicio = inicioBloque; inicio + DURACION_CITA_MINUTOS <= finBloque; inicio += DURACION_CITA_MINUTOS) {
      const hora = minutosAHora(inicio);
      try {
        validarNuevaCita({ ...d, hora });
        horarios.push(hora);
      } catch (error) {
        if (!(error instanceof ErrorDeNegocio)) throw error;
      }
    }
  }
  return horarios;
}
