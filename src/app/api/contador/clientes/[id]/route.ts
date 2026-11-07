import { exigirContador } from '@/lib/auth/sesionContador';
import { actualizarCliente, obtenerDetalleCliente } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCambiosCliente } from '@/lib/validacion/esquemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
type Contexto = { params: Promise<{ id: string }> };
export const GET = conManejoDeErrores(async (_request: Request, { params }: Contexto) => {
  await exigirContador();
  const { id } = await params;
  return responderOk(await obtenerDetalleCliente(z.string().uuid().parse(id)));
});
export const PATCH = conManejoDeErrores(async (request: Request, { params }: Contexto) => {
  await exigirContador();
  const { id } = await params;
  const cambios = await leerCuerpo(request, esquemaCambiosCliente);
  await actualizarCliente(z.string().uuid().parse(id), cambios);
  return responderOk({ actualizado: true });
});
