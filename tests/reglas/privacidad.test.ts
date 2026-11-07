import { describe, expect, it } from 'vitest';
import { coincidenUltimos4, enmascararCC } from '@/lib/reglas/privacidad';

describe('reglas de privacidad', () => {
  it('T-33 enmascara todos los dígitos de la cédula menos los últimos cuatro', () => {
    expect(enmascararCC('1082912449')).toBe('******2449');
  });

  it('T-34 verifica los últimos cuatro dígitos del teléfono', () => {
    expect(coincidenUltimos4('3001234567', '4567')).toBe(true);
  });
});
