import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { ESTADO_HTTP, ErrorDeNegocio, type CodigoError } from '@/lib/reglas/errores';

const HEADERS_SIN_CACHE = { 'Cache-Control': 'no-store' };

export function responderOk<T>(datos: T, estado = 200): NextResponse {
  return NextResponse.json({ ok: true, datos }, { status: estado, headers: HEADERS_SIN_CACHE });
}

const RESTRICCIONES: Record<string, CodigoError> = {
  clientes_cc_unica: 'CC_DUPLICADA',
  ux_citas_una_activa_por_cliente: 'CITA_ACTIVA_EXISTENTE',
  ux_pagos_consulta_confirmado: 'PAGO_YA_CONFIRMADO',
  ux_pagos_servicio_confirmado: 'PAGO_YA_CONFIRMADO',
  revisiones_una_por_cita: 'REVISION_EXISTENTE',
  revisiones_una_por_cliente: 'REVISION_EXISTENTE',
  citas_sin_cruce: 'CITA_CRUCE_HORARIO',
};

function esErrorPostgres(error: unknown): error is { code: string; constraint?: string } {
  return typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string';
}

export function responderError(error: unknown): NextResponse {
  if (error instanceof ErrorDeNegocio) {
    return NextResponse.json({
      ok: false,
      error: {
        codigo: error.codigo,
        mensaje: error.message,
        detalles: error.detalles ?? null,
      },
    }, { status: ESTADO_HTTP[error.codigo], headers: HEADERS_SIN_CACHE });
  }

  if (error instanceof ZodError) {
    const negocio = new ErrorDeNegocio('DATOS_INVALIDOS', undefined, error.flatten());
    return NextResponse.json({
      ok: false,
      error: { codigo: negocio.codigo, mensaje: negocio.message, detalles: negocio.detalles },
    }, { status: ESTADO_HTTP[negocio.codigo], headers: HEADERS_SIN_CACHE });
  }

  if (esErrorPostgres(error)) {
    const codigo = error.code === '23514'
      ? 'DATOS_INVALIDOS'
      : RESTRICCIONES[error.constraint ?? ''];
    if (codigo) {
      const negocio = new ErrorDeNegocio(codigo);
      return NextResponse.json({
        ok: false,
        error: { codigo, mensaje: negocio.message, detalles: null },
      }, { status: ESTADO_HTTP[codigo], headers: HEADERS_SIN_CACHE });
    }
  }

  console.error('Error interno en una ruta API.', error);
  const negocio = new ErrorDeNegocio('ERROR_INTERNO');
  return NextResponse.json({
    ok: false,
    error: { codigo: negocio.codigo, mensaje: negocio.message, detalles: null },
  }, { status: ESTADO_HTTP[negocio.codigo], headers: HEADERS_SIN_CACHE });
}

export function conManejoDeErrores<Argumentos extends unknown[]>(
  handler: (...argumentos: Argumentos) => Promise<Response>,
): (...argumentos: Argumentos) => Promise<Response> {
  return async (...argumentos: Argumentos) => {
    try {
      return await handler(...argumentos);
    } catch (error) {
      return responderError(error);
    }
  };
}

export async function leerCuerpo<Esquema extends ZodType>(
  request: Request,
  esquema: Esquema,
): Promise<Esquema['_output']> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return esquema.parse(cuerpo);
}
