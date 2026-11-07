import { exigirContador } from '@/lib/auth/sesionContador';
import { iniciarTramite } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await exigirContador();
  const { id } = await params;
  await iniciarTramite(z.string().uuid().parse(id));
  return responderOk({ estado: 'en_proceso' });
});
