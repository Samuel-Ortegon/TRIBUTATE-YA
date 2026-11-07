import { exigirContador } from '@/lib/auth/sesionContador';
import { corregirRevision } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCorreccion, esquemaIdNumerico } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await exigirContador();
  const { id } = await params;
  const { resultado, motivo } = await leerCuerpo(request, esquemaCorreccion);
  await corregirRevision(esquemaIdNumerico.parse(id), resultado, motivo);
  return responderOk({ corregida: true });
});
