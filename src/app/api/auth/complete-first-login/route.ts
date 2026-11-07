import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdminKey, getSupabaseConfig } from '@/lib/supabase-config';

type SupabaseUser = {
  id?: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

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
    !('fullName' in body) ||
    !('newPassword' in body) ||
    typeof body.fullName !== 'string' ||
    typeof body.newPassword !== 'string' ||
    !body.fullName.trim() ||
    body.newPassword.length < 8
  ) {
    return NextResponse.json(
      { error: 'Indica tu nombre y una contraseña nueva de al menos 8 caracteres.' },
      { status: 400 },
    );
  }

  const config = getSupabaseConfig();
  const adminKey = getSupabaseAdminKey();
  if (!config || !adminKey) {
    return NextResponse.json({ error: 'La autenticación no está configurada para completar el primer acceso.' }, { status: 503 });
  }

  const accessToken = (await cookies()).get('supabase-access-token')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'Inicia sesión para completar tu primer acceso.' }, { status: 401 });
  }

  let authResponse: Response;
  try {
    authResponse = await fetch(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.publicKey, Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servicio de autenticación.' }, { status: 502 });
  }

  if (!authResponse.ok) {
    return NextResponse.json({ error: 'La sesión expiró. Inicia sesión nuevamente.' }, { status: 401 });
  }

  const authenticatedUser = (await authResponse.json()) as SupabaseUser;
  if (!authenticatedUser.id || !authenticatedUser.email) {
    return NextResponse.json({ error: 'No se pudo validar la cuenta.' }, { status: 502 });
  }

  const adminHeaders = {
    apikey: adminKey,
    Authorization: `Bearer ${adminKey}`,
    'content-type': 'application/json',
  };

  let adminUserResponse: Response;
  try {
    adminUserResponse = await fetch(`${config.url}/auth/v1/admin/users/${authenticatedUser.id}`, {
      headers: adminHeaders,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo verificar el estado de la cuenta.' }, { status: 502 });
  }

  if (!adminUserResponse.ok) {
    return NextResponse.json({ error: 'No se pudo verificar el estado de la cuenta.' }, { status: 502 });
  }

  const adminPayload = (await adminUserResponse.json()) as SupabaseUser | { user?: SupabaseUser };
  const adminUser =
    'user' in adminPayload && adminPayload.user ? adminPayload.user : (adminPayload as SupabaseUser);
  if (adminUser?.app_metadata?.must_change_password !== true) {
    return NextResponse.json({ error: 'Esta cuenta no requiere completar el primer acceso.' }, { status: 409 });
  }

  const perfilResponse = await fetch(
    `${config.url}/rest/v1/users?on_conflict=id`,
    {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        full_name: body.fullName.trim(),
        updated_at: new Date().toISOString(),
      }),
      cache: 'no-store',
    },
  );

  if (!perfilResponse.ok) {
    return NextResponse.json({ error: 'No se pudo guardar tu nombre. Inténtalo de nuevo.' }, { status: 500 });
  }

  let updateResponse: Response;
  try {
    updateResponse = await fetch(`${config.url}/auth/v1/admin/users/${authenticatedUser.id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        password: body.newPassword,
        app_metadata: { ...adminUser.app_metadata, must_change_password: false },
        user_metadata: { ...adminUser.user_metadata, full_name: body.fullName.trim() },
      }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo actualizar la contraseña.' }, { status: 502 });
  }

  if (!updateResponse.ok) {
    return NextResponse.json({ error: 'No se pudo actualizar la contraseña. Inténtalo de nuevo.' }, { status: 400 });
  }

  const response = NextResponse.json({ message: 'Datos guardados. Ya puedes iniciar sesión con tu nueva contraseña.' });
  response.cookies.set('supabase-access-token', '', { path: '/', maxAge: 0 });
  response.cookies.set('supabase-refresh-token', '', { path: '/', maxAge: 0 });
  return response;
}