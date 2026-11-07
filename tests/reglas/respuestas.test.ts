import { describe, expect, it, vi } from 'vitest';
import { conManejoDeErrores, leerCuerpo, responderError, responderOk } from '@/lib/http/respuestas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { esquemaCC } from '@/lib/validacion/esquemas';

describe('respuestas HTTP', () => {
  it('responde exitosamente y deshabilita el caché', async () => {
    const respuesta = responderOk({ id: 1 });
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store');
    await expect(respuesta.json()).resolves.toEqual({ ok: true, datos: { id: 1 } });
  });

  it('traduce errores de negocio al contrato de API', async () => {
    const respuesta = responderError(new ErrorDeNegocio('NO_AUTORIZADO'));
    expect(respuesta.status).toBe(401);
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store');
    await expect(respuesta.json()).resolves.toMatchObject({
      ok: false,
      error: { codigo: 'NO_AUTORIZADO', detalles: null },
    });
  });

  it('traduce restricciones conocidas de PostgreSQL', async () => {
    const respuesta = responderError({ code: '23505', constraint: 'clientes_cc_unica' });
    expect(respuesta.status).toBe(409);
    await expect(respuesta.json()).resolves.toMatchObject({
      error: { codigo: 'CC_DUPLICADA' },
    });
  });

  it('convierte fallos de validación Zod a DATOS_INVALIDOS', async () => {
    const respuesta = responderError(esquemaCC.safeParse('12').error);
    expect(respuesta.status).toBe(400);
    await expect(respuesta.json()).resolves.toMatchObject({
      error: { codigo: 'DATOS_INVALIDOS', detalles: { formErrors: expect.any(Array) } },
    });
  });

  it('rechaza cuerpos JSON inválidos como DATOS_INVALIDOS', async () => {
    await expect(leerCuerpo(new Request('http://localhost', {
      method: 'POST',
      body: '{',
    }), esquemaCC)).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
  });

  it('envuelve errores del handler y los convierte en respuestas HTTP', async () => {
    const obtenerRespuesta = conManejoDeErrores(async () => {
      throw new ErrorDeNegocio('DATOS_INVALIDOS');
    });
    const respuesta = await obtenerRespuesta();
    expect(respuesta.status).toBe(400);
  });

  it('registra errores inesperados y no expone detalles internos', async () => {
    const errorInterno = new Error('detalle confidencial');
    const registro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const respuesta = responderError(errorInterno);
    expect(respuesta.status).toBe(500);
    expect(registro).toHaveBeenCalledWith('Error interno en una ruta API.', errorInterno);
    await expect(respuesta.json()).resolves.toMatchObject({
      error: { codigo: 'ERROR_INTERNO', detalles: null },
    });
    registro.mockRestore();
  });
});
