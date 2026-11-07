import { cancelarCita, obtenerCitaActiva, verificarCliente } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaCancelarCita, esquemaVerificacionCliente } from '@/lib/validacion/esquemas';

const esquemaCancelarPublico = esquemaVerificacionCliente.extend({ motivo: esquemaCancelarCita.shape.motivo });
export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const datos = await leerCuerpo(request, esquemaCancelarPublico);
  const cliente = await verificarCliente(datos.cc, datos.ultimos4);
  const cita = await obtenerCitaActiva(cliente.id);
  if (!cita) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
  await cancelarCita(cita.id, datos.motivo || 'Cancelada por el cliente', 'cliente');
  return responderOk({ cancelada: true });
});
