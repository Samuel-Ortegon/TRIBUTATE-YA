import { describe, expect, it } from 'vitest';
import {
  calcularHorariosDisponibles,
  seCruzan,
  validarNuevaCita,
  validarReprogramacionCita,
} from '@/lib/reglas/agenda';
import { esperarCodigo } from './ayudas';

const ahora = { fecha: '2030-01-02', minutos: 480 };

describe('reglas de agenda', () => {
  it('T-07 detecta cruce entre citas parcialmente superpuestas', () => {
    expect(seCruzan({ inicio: 600, fin: 630 }, { inicio: 615, fin: 645 })).toBe(true);
  });

  it('T-08 permite citas contiguas porque el intervalo es semiabierto', () => {
    expect(seCruzan({ inicio: 600, fin: 630 }, { inicio: 630, fin: 660 })).toBe(false);
  });

  it('T-09 detecta cruce cuando la segunda cita empieza antes de terminar la primera', () => {
    expect(seCruzan({ inicio: 600, fin: 630 }, { inicio: 585, fin: 615 })).toBe(true);
  });

  it('T-10 rechaza una cita a las 10:15 si existe una a las 10:00', () => {
    esperarCodigo(() => validarNuevaCita({
      fecha: '2030-01-07',
      hora: '10:15',
      ahora,
      ocupadas: [{ inicio: '10:00', fin: '10:30' }],
      origen: 'contador',
    }), 'CITA_CRUCE_HORARIO');
  });

  it('T-11 permite agendar a las 10:30 si la cita anterior termina a esa hora', () => {
    expect(() => validarNuevaCita({
      fecha: '2030-01-07',
      hora: '10:30',
      ahora,
      ocupadas: [{ inicio: '10:00', fin: '10:30' }],
      origen: 'contador',
    })).not.toThrow();
  });

  it('T-12 rechaza una cita que excede el bloque de atención', () => {
    esperarCodigo(() => validarNuevaCita({
      fecha: '2030-01-07',
      hora: '11:45',
      ahora,
      ocupadas: [],
      origen: 'contador',
    }), 'FUERA_DE_HORARIO');
  });

  it('T-13 rechaza agendar el domingo', () => {
    esperarCodigo(() => validarNuevaCita({
      fecha: '2030-01-06',
      hora: '10:00',
      ahora,
      ocupadas: [],
      origen: 'contador',
    }), 'FUERA_DE_HORARIO');
  });

  it('T-14 rechaza una fecha pasada', () => {
    esperarCodigo(() => validarNuevaCita({
      fecha: '2030-01-01',
      hora: '10:00',
      ahora,
      ocupadas: [],
      origen: 'contador',
    }), 'CITA_EN_PASADO');
  });

  it('T-15 exige anticipación al cliente, pero no al contador', () => {
    const cita = {
      fecha: '2030-01-02',
      hora: '09:00',
      ahora,
      ocupadas: [],
      origen: 'cliente' as const,
    };
    esperarCodigo(() => validarNuevaCita(cita), 'ANTICIPACION_INSUFICIENTE');
    expect(() => validarNuevaCita({ ...cita, origen: 'contador' })).not.toThrow();
  });

  it('T-16 rechaza agendar a más de 30 días', () => {
    esperarCodigo(() => validarNuevaCita({
      fecha: '2030-02-02',
      hora: '10:00',
      ahora,
      ocupadas: [],
      origen: 'contador',
    }), 'FECHA_FUERA_DE_RANGO');
  });

  it('T-17 devuelve los 16 horarios disponibles del lunes', () => {
    const horarios = calcularHorariosDisponibles({
      fecha: '2030-01-07',
      ahora,
      ocupadas: [],
      origen: 'contador',
    });
    expect(horarios).toHaveLength(16);
    expect(horarios[0]).toBe('08:00');
    expect(horarios[7]).toBe('11:30');
    expect(horarios[8]).toBe('14:00');
    expect(horarios[15]).toBe('17:30');
  });

  it('T-18 excluye la cita ocupada y conserva el horario contiguo', () => {
    const horarios = calcularHorariosDisponibles({
      fecha: '2030-01-07',
      ahora,
      ocupadas: [{ inicio: '10:00', fin: '10:30' }],
      origen: 'contador',
    });
    expect(horarios).toHaveLength(15);
    expect(horarios).not.toContain('10:00');
    expect(horarios).toContain('10:30');
  });

  it('permite al cliente reprogramar una cita activa con pago confirmado o en revisión', () => {
    expect(() => validarReprogramacionCita({
      estadoCita: 'agendada',
      tienePagoProtegido: true,
      origen: 'cliente',
    })).not.toThrow();
  });

  it('rechaza la reprogramación pública sin pago protegido o con una cita cerrada', () => {
    esperarCodigo(() => validarReprogramacionCita({
      estadoCita: 'agendada',
      tienePagoProtegido: false,
      origen: 'cliente',
    }), 'CITA_SIN_PAGO');
    esperarCodigo(() => validarReprogramacionCita({
      estadoCita: 'atendida',
      tienePagoProtegido: true,
      origen: 'cliente',
    }), 'CITA_NO_MODIFICABLE');
  });
});
