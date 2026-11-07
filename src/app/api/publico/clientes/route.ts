import { registrarCliente } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaRegistroCliente } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const datos = await leerCuerpo(request, esquemaRegistroCliente);
  await registrarCliente(datos, 'cliente');
  return responderOk({ registrado: true }, 201);
});
