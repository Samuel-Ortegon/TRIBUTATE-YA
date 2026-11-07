import { exigirContador } from '@/lib/auth/sesionContador';
import { registrarRevision } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaRevision } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const datos = await leerCuerpo(request, esquemaRevision);
  return responderOk(await registrarRevision({
    citaId: datos.citaId,
    resultado: datos.resultado,
    ...(datos.observaciones !== undefined ? { observaciones: datos.observaciones } : {}),
  }), 201);
});
