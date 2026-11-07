import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase-config';
import { MENSAJES } from '@/lib/reglas/errores';

interface UsuarioSupabase {
  id?: string;
  app_metadata?: {
    role?: unknown;
    roles?: unknown;
  };
}

function tieneRolPermitido(usuario: UsuarioSupabase): boolean {
  const rol = usuario.app_metadata?.role;
  const roles = usuario.app_metadata?.roles;
  if (typeof rol === 'string') return ['admin', 'administrador', 'contador'].includes(rol.toLowerCase());
  if (Array.isArray(roles)) {
    return roles.some((valor: unknown) =>
      typeof valor === 'string' && ['admin', 'administrador', 'contador'].includes(valor.toLowerCase()));
  }
  return true;
}

function respuestaNoAutorizada(): NextResponse {
  return NextResponse.json({
    ok: false,
    error: {
      codigo: 'NO_AUTORIZADO',
      mensaje: MENSAJES.NO_AUTORIZADO,
      detalles: null,
    },
  }, {
    status: 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function middleware(request: NextRequest) {
  const ruta = request.nextUrl.pathname;
  const esAPI = ruta.startsWith('/api/contador/');
  const esPanel = ruta === '/contador' || ruta.startsWith('/contador/');
  if (!esAPI && !esPanel) return NextResponse.next();
  const enviarAlLogin = () => {
    const respuesta = NextResponse.redirect(new URL('/login', request.url));
    respuesta.headers.set('Cache-Control', 'no-store');
    return respuesta;
  };
  const token = request.cookies.get('supabase-access-token')?.value;
  if (!token) return esAPI ? respuestaNoAutorizada() : enviarAlLogin();

  const configSupabase = getSupabaseConfig();
  if (!configSupabase) {
    console.error('La autenticación no está configurada para proteger las rutas del contador.');
    return NextResponse.json({
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Ocurrió un error inesperado. Intente de nuevo.',
        detalles: null,
      },
    }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }

  let respuestaAuth: Response;
  try {
    respuestaAuth = await fetch(`${configSupabase.url}/auth/v1/user`, {
      headers: { apikey: configSupabase.publicKey, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('No se pudo verificar la sesión para proteger las rutas del contador.', error);
    return NextResponse.json({
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Ocurrió un error inesperado. Intente de nuevo.',
        detalles: null,
      },
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (respuestaAuth.status === 401 || respuestaAuth.status === 403) {
    return esAPI ? respuestaNoAutorizada() : enviarAlLogin();
  }
  if (!respuestaAuth.ok) {
    console.error(`El servicio de autenticación respondió HTTP ${respuestaAuth.status}.`);
    return NextResponse.json({
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Ocurrió un error inesperado. Intente de nuevo.',
        detalles: null,
      },
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  let usuario: UsuarioSupabase;
  try {
    usuario = await respuestaAuth.json() as UsuarioSupabase;
  } catch (error) {
    console.error('El servicio de autenticación devolvió una respuesta inválida.', error);
    return NextResponse.json({
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        mensaje: 'Ocurrió un error inesperado. Intente de nuevo.',
        detalles: null,
      },
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!usuario.id || !tieneRolPermitido(usuario)) return esAPI ? respuestaNoAutorizada() : enviarAlLogin();
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/prueba-correo',
    '/api/correo/prueba',
    '/contador/:path*',
    '/api/contador/:path*',
  ],
};
