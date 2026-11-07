import { describe, expect, it } from 'vitest';
import { validarCorreccionRevision } from '@/lib/reglas/revisiones';
import { esperarCodigo } from './ayudas';

describe('reglas de revisiones', () => {
  it('T-35 impide corregir la revisión si hay un pago del servicio no anulado', () => {
    esperarCodigo(() => validarCorreccionRevision({
      estadoCliente: 'debe_declarar',
      resultadoActual: 'debe_declarar',
      resultadoNuevo: 'no_debe_declarar',
      pagosServicioNoAnulados: 1,
      motivo: 'Corrección justificada',
    }), 'REVISION_NO_CORREGIBLE');
  });
});
