import { describe, expect, it } from 'vitest';
import { estadoFechaLimite } from '@/lib/reglas/fechas';

describe('reglas de fechas', () => {
  it('T-19 calcula una fecha límite pendiente y sus días restantes', () => {
    expect(estadoFechaLimite('2030-01-02', '2030-01-12'))
      .toEqual({ estado: 'pendiente', diasRestantes: 10 });
  });

  it('T-20 identifica cuando la fecha límite es hoy', () => {
    expect(estadoFechaLimite('2030-01-02', '2030-01-02'))
      .toEqual({ estado: 'vence_hoy', diasRestantes: 0 });
  });

  it('T-21 calcula días negativos para una fecha vencida', () => {
    expect(estadoFechaLimite('2030-01-05', '2030-01-02'))
      .toEqual({ estado: 'vencida', diasRestantes: -3 });
  });

  it('T-22 representa como sin información una fecha límite ausente', () => {
    expect(estadoFechaLimite('2030-01-02', null))
      .toEqual({ estado: 'sin_informacion', diasRestantes: null });
  });
});
