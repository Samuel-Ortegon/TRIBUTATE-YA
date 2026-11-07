import { consultarFechaLimite } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaConsultaFechaLimite } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const { cc } = await leerCuerpo(request, esquemaConsultaFechaLimite);
  return responderOk(await consultarFechaLimite(cc));
});
