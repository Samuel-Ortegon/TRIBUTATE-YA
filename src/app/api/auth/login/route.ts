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
    !('password' in body) ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string' ||
    !body.email.trim() ||
    !body.password
  ) {
    return NextResponse.json({ error: 'Correo y contraseña son obligatorios' }, { status: 400 });
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json({ error: 'La autenticación no está configurada' }, { status: 503 });
  }

  let authResponse: Response;
  try {
    authResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: config.publicKey, 'content-type': 'application/json' },
      body: JSON.stringify({ email: body.email.trim(), password: body.password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servicio de autenticación' }, { status: 502 });
  }

  if (!authResponse.ok) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 });
  }

  const session = (await authResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id?: string; email?: string };
  };
  if (!session.access_token || !session.refresh_token || !session.user?.id) {
    return NextResponse.json({ error: 'Respuesta de autenticación inválida' }, { status: 502 });
  }

  const response = NextResponse.json({ user: { id: session.user.id, email: session.user.email } });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  response.cookies.set('supabase-access-token', session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in ?? 3600,
  });
  response.cookies.set('supabase-refresh-token', session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 24 * 60 * 60,
  });
  return response;
}