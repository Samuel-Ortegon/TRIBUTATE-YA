import { exigirContador } from '@/lib/auth/sesionContador';
import { listarPagosEnRevision, registrarPago } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaPago } from '@/lib/validacion/esquemas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  if (new URL(request.url).searchParams.get('estado') !== 'requiere_revision') {
    throw new ErrorDeNegocio('DATOS_INVALIDOS');
  }
  return responderOk(await listarPagosEnRevision());
});
export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const datos = await leerCuerpo(request, esquemaPago);
  return responderOk(await registrarPago({
    clienteId: datos.clienteId,
    tipo: datos.tipo,
    monto: datos.monto,
    metodo: datos.metodo,
    fechaPago: datos.fechaPago,
    ...(datos.citaId !== undefined ? { citaId: datos.citaId } : {}),
    ...(datos.referencia !== undefined ? { referencia: datos.referencia } : {}),
  }), 201);
});
