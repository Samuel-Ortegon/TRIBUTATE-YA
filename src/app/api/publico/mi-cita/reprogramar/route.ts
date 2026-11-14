import { obtenerCitaActiva, reprogramarCita, verificarCliente } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAgendarPublico } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const datos = await leerCuerpo(request, esquemaAgendarPublico);
  const cliente = await verificarCliente(datos.cc, datos.ultimos4);
  const cita = await obtenerCitaActiva(cliente.id);
  if (!cita) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');

  await reprogramarCita(cita.id, datos.fecha, datos.hora, 'cliente', cliente.id);
  const citaActualizada = await obtenerCitaActiva(cliente.id);
  if (!citaActualizada) throw new ErrorDeNegocio('ERROR_INTERNO');

  return responderOk({
    reprogramada: true,
    cita: {
      fecha: citaActualizada.fecha,
      hora: citaActualizada.hora,
      horaFin: citaActualizada.horaFin,
      valor: citaActualizada.valor,
      estadoPago: citaActualizada.estadoPago,
    },
  });
});
