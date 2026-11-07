import { obtenerCitaActiva, verificarCliente } from '@/lib/dataService';
import { ETIQUETA_ESTADO } from '@/lib/reglas/estados';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaVerificacionCliente } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const { cc, ultimos4 } = await leerCuerpo(request, esquemaVerificacionCliente);
  const cliente = await verificarCliente(cc, ultimos4);
  const cita = await obtenerCitaActiva(cliente.id);
  return responderOk({
    cita: cita ? {
      fecha: cita.fecha, hora: cita.hora, horaFin: cita.horaFin,
      valor: cita.valor, estadoPago: cita.estadoPago,
    } : null,
    estadoTramite: cliente.estado,
    etiquetaEstado: ETIQUETA_ESTADO[cliente.estado],
  });
});
