import { getToken } from '@vercel/connect';
import { Resend } from 'resend';

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
      from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
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
