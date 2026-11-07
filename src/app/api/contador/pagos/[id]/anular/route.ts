import { exigirContador } from '@/lib/auth/sesionContador';
import { anularPago } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaIdNumerico, esquemaObservacionBody } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await exigirContador();
  const { id } = await params;
  const { observacion } = await leerCuerpo(request, esquemaObservacionBody);
  await anularPago(esquemaIdNumerico.parse(id), observacion);
  return responderOk({ anulado: true });
});
