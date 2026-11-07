import { exigirContador } from '@/lib/auth/sesionContador';
import { agregarRangoCalendario, listarCalendario } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaRango } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async () => {
  await exigirContador();
  return responderOk(await listarCalendario());
});
export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  return responderOk(await agregarRangoCalendario(await leerCuerpo(request, esquemaRango)), 201);
});
