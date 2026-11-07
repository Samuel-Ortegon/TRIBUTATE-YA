import { exigirContador } from '@/lib/auth/sesionContador';
import { eliminarRangoCalendario } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaIdNumerico } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const DELETE = conManejoDeErrores(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await exigirContador();
  const { id } = await params;
  await eliminarRangoCalendario(esquemaIdNumerico.parse(id));
  return responderOk({ eliminado: true });
});
