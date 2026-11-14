import { z } from 'zod';
import { exigirContador } from '@/lib/auth/sesionContador';
import { agregarNota, listarNotas } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaNotaCliente } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
type Contexto = { params: Promise<{ id: string }> };

export const GET = conManejoDeErrores(async (_request: Request, { params }: Contexto) => {
  await exigirContador();
  const { id } = await params;
  return responderOk(await listarNotas(z.string().uuid().parse(id)));
});

export const POST = conManejoDeErrores(async (request: Request, { params }: Contexto) => {
  await exigirContador();
  const { id } = await params;
  const clienteId = z.string().uuid().parse(id);
  const { texto } = await leerCuerpo(request, esquemaNotaCliente);
  return responderOk(await agregarNota(clienteId, texto), 201);
});
