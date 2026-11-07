import { agendarCita, horarioFin, verificarCliente } from '@/lib/dataService';
import { INSTRUCCIONES_PAGO, TARIFA_PRIMERA_CONSULTA } from '@/lib/config/negocio';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAgendarPublico } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const datos = await leerCuerpo(request, esquemaAgendarPublico);
  const cliente = await verificarCliente(datos.cc, datos.ultimos4);
  await agendarCita({
    clienteId: cliente.id, fecha: datos.fecha, hora: datos.hora, origen: 'cliente',
  });
  return responderOk({
    fecha: datos.fecha,
    hora: datos.hora,
    horaFin: horarioFin(datos.hora),
    valor: TARIFA_PRIMERA_CONSULTA,
    instruccionesPago: INSTRUCCIONES_PAGO,
  }, 201);
});
