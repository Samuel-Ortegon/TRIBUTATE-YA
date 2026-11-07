import { exigirContador } from '@/lib/auth/sesionContador';
import { listarClientes, registrarCliente } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaEstadoCliente, esquemaRegistroCliente } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const url = new URL(request.url);
  const estadoParam = url.searchParams.get('estado');
  const estado = estadoParam ? esquemaEstadoCliente.parse(estadoParam) : undefined;
  const busqueda = url.searchParams.get('busqueda');
  return responderOk(await listarClientes({
    ...(busqueda ? { busqueda } : {}),
    ...(estado ? { estado } : {}),
  }));
});
export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const datos = await leerCuerpo(request, esquemaRegistroCliente);
  return responderOk(await registrarCliente(datos, 'contador'), 201);
});
