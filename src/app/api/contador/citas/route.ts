import { exigirContador } from '@/lib/auth/sesionContador';
import { agendarCita, listarCitas, obtenerContactoCliente } from '@/lib/dataService';
import { conManejoDeErrores, leerCuerpo, responderOk } from '@/lib/http/respuestas';
import { esquemaAgendarContador, esquemaFechasCitas } from '@/lib/validacion/esquemas';
import { enviarConfirmacionCita } from '@/lib/correo';
import { TARIFA_PRIMERA_CONSULTA } from '@/lib/config/negocio';

export const dynamic = 'force-dynamic';
export const GET = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const url = new URL(request.url);
  const { desde, hasta } = esquemaFechasCitas.parse({
    desde: url.searchParams.get('desde'), hasta: url.searchParams.get('hasta'),
  });
  return responderOk(await listarCitas(desde, hasta));
});
export const POST = conManejoDeErrores(async (request: Request) => {
  await exigirContador();
  const datos = await leerCuerpo(request, esquemaAgendarContador);
  const cita = await agendarCita({ ...datos, origen: 'contador' });
  try {
    const contacto = await obtenerContactoCliente(datos.clienteId);
    await enviarConfirmacionCita({
      ...contacto, fecha: datos.fecha, hora: datos.hora, valor: TARIFA_PRIMERA_CONSULTA,
    });
  } catch (error) {
    console.error('La cita se agendó, pero falló la notificación por correo.', error);
  }
  return responderOk(cita, 201);
});
