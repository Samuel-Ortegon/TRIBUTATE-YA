import { describe, expect, it } from 'vitest';
import { evaluarMonto, validarRegistroPago, validarResolucionPago } from '@/lib/reglas/pagos';
import { esperarCodigo } from './ayudas';

describe('reglas de pagos', () => {
  it('T-01 deja pendiente un monto menor para la consulta', () => {
    expect(evaluarMonto(49_000, 50_000)).toBe('pendiente');
  });

  it('T-02 confirma el monto exacto de la consulta', () => {
    expect(evaluarMonto(50_000, 50_000)).toBe('confirmado');
  });

  it('T-03 solicita revisión para un monto mayor de la consulta', () => {
    expect(evaluarMonto(60_000, 50_000)).toBe('requiere_revision');
  });

  it('T-04 deja pendiente un monto menor para el servicio', () => {
    expect(evaluarMonto(299_000, 300_000)).toBe('pendiente');
  });

  it('T-05 confirma el monto exacto del servicio', () => {
    expect(evaluarMonto(300_000, 300_000)).toBe('confirmado');
  });

  it('T-06 solicita revisión para un monto mayor del servicio', () => {
    expect(evaluarMonto(350_000, 300_000)).toBe('requiere_revision');
  });

  it('T-27 no permite registrar el servicio si el cliente no debe declarar', () => {
    esperarCodigo(() => validarRegistroPago({
      tipo: 'servicio_completo',
      estadoCliente: 'no_debe_declarar',
      cita: null,
      existeConfirmado: false,
    }), 'PAGO_SERVICIO_NO_DISPONIBLE');
  });

  it('T-28 rechaza registrar una consulta que ya tiene pago confirmado', () => {
    esperarCodigo(() => validarRegistroPago({
      tipo: 'primera_consulta',
      estadoCliente: 'cita_agendada',
      cita: { estadoCita: 'agendada', estadoPago: 'pendiente' },
      existeConfirmado: true,
    }), 'PAGO_YA_CONFIRMADO');
  });

  it('T-36 no permite anular un pago confirmado', () => {
    esperarCodigo(() => validarResolucionPago({
      estadoPago: 'confirmado',
      decision: 'anular',
      observacion: 'Anulación no permitida',
    }), 'PAGO_NO_MODIFICABLE');
  });
});
