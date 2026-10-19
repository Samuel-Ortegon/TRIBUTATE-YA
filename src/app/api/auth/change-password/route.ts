import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase-config';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    !('currentPassword' in body) ||
    !('newPassword' in body) ||
    typeof body.email !== 'string' ||
    typeof body.currentPassword !== 'string' ||
    typeof body.newPassword !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Email, contraseña actual y nueva contraseña son obligatorios' },
      { status: 400 },
    );
  }

  const email = body.email.trim();
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Completa todos los campos para cambiar la contraseña' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json({ error: 'La autenticación no está configurada' }, { status: 503 });
  }

  let signInResponse: Response;
  try {
    signInResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: config.publicKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: currentPassword }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servicio de autenticación' }, { status: 502 });
  }

  if (!signInResponse.ok) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta' }, { status: 401 });
  }

  const signInSession = (await signInResponse.json()) as {
    access_token?: string;
    user?: { id?: string };
  };

  if (!signInSession.access_token) {
    return NextResponse.json({ error: 'Respuesta de autenticación inválida' }, { status: 502 });
  }

  let updateResponse: Response;
  try {
    updateResponse = await fetch(`${config.url}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        apikey: config.publicKey,
        Authorization: `Bearer ${signInSession.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 502 });
  }

  if (!updateResponse.ok) {
    let message = 'No se pudo actualizar la contraseña';
    try {
      const errorPayload = (await updateResponse.json()) as {
        message?: string;
        error_description?: string;
      };
      message = errorPayload.message ?? errorPayload.error_description ?? message;
    } catch {
      // No-op: mantiene el mensaje por defecto.
    }
    return NextResponse.json({ error: message }, { status: updateResponse.status >= 400 && updateResponse.status < 500 ? 400 : 500 });
  }

  return NextResponse.json({ message: 'La contraseña se actualizó correctamente.' });
}
