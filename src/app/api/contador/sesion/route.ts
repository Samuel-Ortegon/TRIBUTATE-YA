import { exigirContador } from '@/lib/auth/sesionContador';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';

export const dynamic = 'force-dynamic';

export const GET = conManejoDeErrores(async () => {
  const contador = await exigirContador();
  return responderOk({ nombre: contador.nombre, correo: contador.correo });
});
