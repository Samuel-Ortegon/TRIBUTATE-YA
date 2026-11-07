import { NextResponse } from 'next/server';
import { z } from 'zod';

import { enviarCorreo } from '@/lib/correo';

const esquemaCorreo = z.object({
  para: z.string().email('El correo de destino no es válido.'),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Esta ruta no está disponible en producción.' }, { status: 404 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es válido.' }, { status: 400 });
  }

  const validacion = esquemaCorreo.safeParse(cuerpo);
  if (!validacion.success) {
    const errorPrimario = validacion.error.issues[0]?.message ?? 'El correo es inválido.';
    return NextResponse.json({ error: errorPrimario }, { status: 400 });
  }

  const resultado = await enviarCorreo({
    para: validacion.data.para,
    asunto: 'Prueba de correo',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #17251f;">
        <h2 style="margin-bottom: 1rem; color: #17352d;">Prueba de correo</h2>
        <p>Este es un correo de prueba enviado desde Tributate Ya.</p>
        <p>Si lo recibes, la integración con Resend funciona correctamente.</p>
      </div>
    `,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      mensaje: 'Correo enviado correctamente.',
      id: resultado.id,
    },
    { status: 200 },
  );
}
