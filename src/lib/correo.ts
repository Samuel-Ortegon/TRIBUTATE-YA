import { getToken } from '@vercel/connect';
import { Resend } from 'resend';
import { INSTRUCCIONES_PAGO } from '@/lib/config/negocio';
import { formatearFechaLarga, formatearPesos } from '@/lib/formato';

export async function obtenerClaveResend(): Promise<string> {
  const claveDesdeEntorno = process.env.RESEND_API_KEY?.trim();
  if (claveDesdeEntorno) {
    return claveDesdeEntorno;
  }

  const token = await getToken('resend/tributate-ya', { subject: { type: 'app' } });
  if (typeof token === 'string' && token.trim()) {
    return token.trim();
  }

  throw new Error('No se pudo obtener la clave de Resend desde Vercel Connect.');
}

export async function enviarCorreo({
  para,
  asunto,
  html,
}: {
  para: string;
  asunto: string;
  html: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const clave = await obtenerClaveResend();
    const cliente = new Resend(clave);
    const respuesta = await cliente.emails.send({
      from: process.env.CORREO_REMITENTE ?? process.env.RESEND_FROM ?? 'onboarding@resend.dev',
      to: [para],
      subject: asunto,
      html,
    });

    if (respuesta && typeof respuesta === 'object' && 'id' in respuesta && typeof respuesta.id === 'string') {
      return { ok: true, id: respuesta.id };
    }

    return { ok: false, error: 'No se recibió un identificador del correo enviado.' };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'No se pudo enviar el correo.';
    return { ok: false, error: mensaje };
  }
}

function escaparHTML(texto: string): string {
  return texto.replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[caracter] ?? caracter);
}

export async function enviarConfirmacionCita(datos: {
  correo: string; nombre: string; fecha: string; hora: string; valor: number;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    console.warn('No se envió confirmación de cita: RESEND_API_KEY no está configurada.');
    return;
  }

  const nombre = escaparHTML(datos.nombre);
  const resultado = await enviarCorreo({
    para: datos.correo,
    asunto: 'Confirmación de cita - Tributate Ya',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #17251f;">
        <h2 style="color: #17352d;">Hola, ${nombre}</h2>
        <p>Tu cita ha sido agendada con estos datos:</p>
        <ul>
          <li><strong>Fecha:</strong> ${formatearFechaLarga(datos.fecha)}</li>
          <li><strong>Hora:</strong> ${escaparHTML(datos.hora)}</li>
          <li><strong>Valor:</strong> ${formatearPesos(datos.valor)}</li>
        </ul>
        <p><strong>Instrucciones de pago:</strong> ${escaparHTML(INSTRUCCIONES_PAGO)}</p>
      </div>
    `,
  });
  if (!resultado.ok) console.error('No se pudo enviar la confirmación de cita.', resultado.error);
}
