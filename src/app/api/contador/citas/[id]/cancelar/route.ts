import { exigirContador } from '@/lib/auth/sesionContador';
import { cancelarCita } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaIdNumerico, esquemaMotivoBody } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await exigirContador();
  const { id } = await params;
  const { motivo } = await leerCuerpo(request, esquemaMotivoBody);
  await cancelarCita(esquemaIdNumerico.parse(id), motivo, 'contador');
  return responderOk({ cancelada: true });
});
