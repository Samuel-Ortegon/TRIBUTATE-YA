import { exigirContador } from '@/lib/auth/sesionContador';
import { reprogramarCita } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaIdNumerico, esquemaReprogramarCita } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await exigirContador();
  const { id } = await params;
  const { fecha, hora } = await leerCuerpo(request, esquemaReprogramarCita);
  await reprogramarCita(esquemaIdNumerico.parse(id), fecha, hora);
  return responderOk({ reprogramada: true });
});
