import { exigirContador } from '@/lib/auth/sesionContador';
import { eliminarCalendarioDemo } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';
export const DELETE = conManejoDeErrores(async () => {
  await exigirContador();
  return responderOk(await eliminarCalendarioDemo());
});
