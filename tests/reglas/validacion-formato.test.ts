import { describe, expect, it } from 'vitest';
import {
  esquemaFecha,
  esquemaPago,
  esquemaNotaCliente,
  esquemaRegistroCliente,
  esquemaRango,
} from '@/lib/validacion/esquemas';
import {
  describirEvento,
  formatearFechaLarga,
  formatearFechaHora,
  formatearHora,
  formatearPesos,
  textoDiasRestantes,
} from '@/lib/formato';

describe('esquemas de validación', () => {
  it('valida una fecha real con formato AAAA-MM-DD', () => {
    expect(esquemaFecha.safeParse('2026-02-29').success).toBe(false);
    expect(esquemaFecha.safeParse('2026-08-15').success).toBe(true);
  });

  it('recorta el nombre y exige autorización de tratamiento', () => {
    const cliente = {
      cc: '1082912449',
      nombre: '  Ana María  ',
      telefono: '3001234567',
      correo: 'ana@example.com',
      aceptaTratamientoDatos: true,
    };
    expect(esquemaRegistroCliente.parse(cliente).nombre).toBe('Ana María');
    expect(esquemaRegistroCliente.safeParse({ ...cliente, aceptaTratamientoDatos: false }).success).toBe(false);
  });

  it('exige una cita para pagos de primera consulta', () => {
    const pago = {
      clienteId: '37c4124e-9f7b-4a48-85ba-8eadc3ce12e6',
      tipo: 'primera_consulta',
      monto: 50_000,
      metodo: 'transferencia',
      fechaPago: '2026-08-15',
    };
    expect(esquemaPago.safeParse(pago).success).toBe(false);
    expect(esquemaPago.safeParse({ ...pago, citaId: 1 }).success).toBe(true);
  });

  it('rechaza un rango de dígitos invertido', () => {
    expect(esquemaRango.safeParse({
      anioGravable: 2026,
      digitoDesde: 30,
      digitoHasta: 20,
      fechaLimite: '2026-08-15',
    }).success).toBe(false);
  });

  it('valida notas del contador y recorta espacios exteriores', () => {
    expect(esquemaNotaCliente.parse({ texto: '  Llamar al cliente  ' }).texto).toBe('Llamar al cliente');
    expect(esquemaNotaCliente.safeParse({ texto: '  ' }).success).toBe(false);
    expect(esquemaNotaCliente.safeParse({ texto: 'x'.repeat(2001) }).success).toBe(false);
  });
});

describe('formato de datos', () => {
  it('formatea montos en pesos enteros', () => {
    expect(formatearPesos(50_000)).toBe('$ 50.000');
  });

  it('formatea fechas sin desplazamiento de zona horaria', () => {
    expect(formatearFechaLarga('2026-08-15')).toBe('15 de agosto de 2026');
  });

  it('formatea horas en formato de 12 horas', () => {
    expect(formatearHora('14:30')).toBe('2:30 p. m.');
  });

  it('formatea una marca de tiempo en Bogotá y describe eventos del historial', () => {
    expect(formatearFechaHora('2026-08-15 14:30')).toBe('15 de agosto de 2026 · 2:30 p. m.');
    expect(describirEvento({
      tipo: 'PAGO_REGISTRADO',
      estadoAnterior: null,
      estadoNuevo: null,
      detalle: { tipo: 'primera_consulta', monto: 50_000, estado: 'confirmado' },
    })).toBe('Pago de primera consulta registrado por $ 50.000: confirmado');
    expect(describirEvento({
      tipo: 'CITA_REPROGRAMADA',
      estadoAnterior: null,
      estadoNuevo: null,
      detalle: {
        fechaAnterior: '2026-08-15',
        horaAnterior: '10:00',
        fecha: '2026-08-16',
        hora: '11:00',
      },
    })).toBe('Cita reprogramada de 2026-08-15 10:00 a 2026-08-16 11:00');
  });

  it('genera textos singulares, plurales y de estados de fecha', () => {
    expect(textoDiasRestantes('pendiente', 10)).toBe('Faltan 10 días');
    expect(textoDiasRestantes('pendiente', 1)).toBe('Falta 1 día');
    expect(textoDiasRestantes('vence_hoy', 0)).toBe('Vence hoy');
    expect(textoDiasRestantes('vencida', -3)).toBe('Venció hace 3 días');
    expect(textoDiasRestantes('sin_informacion', null)).toBe('Sin fecha registrada');
  });
});
