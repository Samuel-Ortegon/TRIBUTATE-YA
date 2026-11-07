import { exigirContador } from '@/lib/auth/sesionContador';
import { agendarCita, listarCitas } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAgendarContador, esquemaFechasCitas } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const url = new URL(request.url);
  const { desde, hasta } = esquemaFechasCitas.parse({
    desde: url.searchParams.get('desde'), hasta: url.searchParams.get('hasta'),
  });
  return responderOk(await listarCitas(desde, hasta));
});
export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const datos = await leerCuerpo(request, esquemaAgendarContador);
  return responderOk(await agendarCita({ ...datos, origen: 'contador' }), 201);
});
