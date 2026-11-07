import { obtenerHorariosDisponibles } from '@/lib/dataService';
import { conManejoDeErrores, responderOk } from '@/lib/http/respuestas';
import { esquemaFechaQuery } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async (request: Request) => {
  const url = new URL(request.url);
  const { fecha } = esquemaFechaQuery.parse({ fecha: url.searchParams.get('fecha') });
  const horarios = await obtenerHorariosDisponibles(fecha, 'cliente');
  return responderOk({ fecha, horarios });
});
