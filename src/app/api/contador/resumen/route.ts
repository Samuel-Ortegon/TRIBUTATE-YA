import { exigirContador } from '@/lib/auth/sesionContador';
import { obtenerResumen } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async () => {
  await exigirContador();
  return responderOk(await obtenerResumen());
});
