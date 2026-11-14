import { agendarCita, horarioFin, verificarCliente } from '@/lib/dataService';
import { INSTRUCCIONES_PAGO, TARIFA_PRIMERA_CONSULTA } from '@/lib/config/negocio';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAgendarPublico } from '@/lib/validacion/esquemas';
import { obtenerContactoCliente } from '@/lib/dataService';
import { enviarConfirmacionCita } from '@/lib/correo';

export const dynamic = 'force-dynamic';
export const POST = conManejoDeErrores(async (request: Request) => {
  const datos = await leerCuerpo(request, esquemaAgendarPublico);
  const cliente = await verificarCliente(datos.cc, datos.ultimos4);
  await agendarCita({
    clienteId: cliente.id, fecha: datos.fecha, hora: datos.hora, origen: 'cliente',
  });
  try {
    const contacto = await obtenerContactoCliente(cliente.id);
    await enviarConfirmacionCita({
      ...contacto, fecha: datos.fecha, hora: datos.hora, valor: TARIFA_PRIMERA_CONSULTA,
    });
  } catch (error) {
    console.error('La cita se agendó, pero falló la notificación por correo.', error);
  }
  return responderOk({
    fecha: datos.fecha,
    hora: datos.hora,
    horaFin: horarioFin(datos.hora),
    valor: TARIFA_PRIMERA_CONSULTA,
    instruccionesPago: INSTRUCCIONES_PAGO,
  }, 201);
});
