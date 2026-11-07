import { describe, expect, it } from 'vitest';
import {
  buscarFechaEnCalendario,
  dosUltimosDigitos,
  validarNuevoRango,
  type RangoCalendario,
} from '@/lib/reglas/calendario';
import { esperarCodigo } from './ayudas';

describe('reglas de calendario', () => {
  it('T-30 busca la fecha en los rangos del mayor año gravable', () => {
    const rangos: RangoCalendario[] = [
      { anioGravable: 2025, digitoDesde: 40, digitoHasta: 59, fechaLimite: '2026-08-20' },
      { anioGravable: 2026, digitoDesde: 0, digitoHasta: 19, fechaLimite: '2027-08-12' },
      { anioGravable: 2026, digitoDesde: 40, digitoHasta: 59, fechaLimite: '2027-08-20' },
    ];
    expect(buscarFechaEnCalendario('1004567849', rangos)).toBe('2027-08-20');
  });

  it('T-31 obtiene cero como los dos últimos dígitos', () => {
    expect(dosUltimosDigitos('1004567800')).toBe(0);
  });

  it('T-32 rechaza rangos que comparten dígitos en el mismo año', () => {
    esperarCodigo(() => validarNuevoRango(
      { anioGravable: 2026, digitoDesde: 10, digitoHasta: 30, fechaLimite: '2027-08-01' },
      [{ anioGravable: 2026, digitoDesde: 0, digitoHasta: 19, fechaLimite: '2027-07-01' }],
    ), 'RANGO_SOLAPADO');
  });
});
