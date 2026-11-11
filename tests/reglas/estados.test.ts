import { describe, expect, it } from 'vitest';
import {
  accionesPermitidas,
  puedeIniciarTramite,
  siguienteEstado,
} from '@/lib/reglas/estados';
import { esperarCodigo } from './ayudas';

describe('reglas de estados', () => {
  it('T-23 agenda una cita desde el estado registrado', () => {
    expect(siguienteEstado('registrado', 'AGENDAR_CITA')).toBe('cita_agendada');
  });

  it('T-24 requiere el pago confirmado antes de registrar la revisión', () => {
    esperarCodigo(() => siguienteEstado('cita_agendada', 'REVISION_DEBE_DECLARAR'), 'ACCION_NO_PERMITIDA_EN_ESTADO');
  });

  it('T-25 no permite pagar el servicio si el cliente no debe declarar', () => {
    esperarCodigo(() => siguienteEstado('no_debe_declarar', 'CONFIRMAR_PAGO_SERVICIO'), 'ACCION_NO_PERMITIDA_EN_ESTADO');
  });

  it('T-26 solo habilita el trámite con estado, resultado y pago confirmados', () => {
    expect(puedeIniciarTramite({
      estado: 'servicio_pagado',
      resultadoRevision: 'debe_declarar',
      tienePagoServicioConfirmado: true,
    })).toBe(true);
    expect(puedeIniciarTramite({
      estado: 'servicio_pagado',
      resultadoRevision: 'debe_declarar',
      tienePagoServicioConfirmado: false,
    })).toBe(false);
    expect(puedeIniciarTramite({
      estado: 'servicio_pagado',
      resultadoRevision: 'no_debe_declarar',
      tienePagoServicioConfirmado: true,
    })).toBe(false);
  });

  it('T-29 muestra iniciar trámite sin permitir registrar otro pago de servicio', () => {
    const acciones = accionesPermitidas('servicio_pagado');
    expect(acciones).toContain('INICIAR_TRAMITE');
    expect(acciones).not.toContain('REGISTRAR_PAGO_SERVICIO');
  });

  it('ofrece reprogramar cuando hay una cita activa aunque el estado del cliente haya avanzado', () => {
    expect(accionesPermitidas('debe_declarar', true)).toContain('REPROGRAMAR_CITA');
    expect(accionesPermitidas('debe_declarar')).not.toContain('REPROGRAMAR_CITA');
  });
});
