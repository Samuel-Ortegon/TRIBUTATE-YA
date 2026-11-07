import { cookies } from 'next/headers';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { getSupabaseConfig } from '@/lib/supabase-config';

interface UsuarioSupabase {
  id?: string;
  email?: string;
  app_metadata?: {
    role?: unknown;
    roles?: unknown;
  };
  user_metadata?: {
    full_name?: unknown;
    name?: unknown;
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

export async function obtenerContador(): Promise<{ id: string; nombre: string; correo: string } | null> {
  const token = (await cookies()).get('supabase-access-token')?.value;
  if (!token) return null;

  const config = getSupabaseConfig();
  if (!config) throw new Error('La autenticación no está configurada.');

  const respuesta = await fetch(`${config.url}/auth/v1/user`, {
    headers: { apikey: config.publicKey, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (respuesta.status === 401 || respuesta.status === 403) return null;
  if (!respuesta.ok) throw new Error(`No se pudo verificar la sesión del contador (HTTP ${respuesta.status}).`);

  const usuario = await respuesta.json() as UsuarioSupabase;
  if (!usuario.id || !usuario.email || !tieneRolPermitido(usuario)) return null;

  const nombreMetadata = usuario.user_metadata?.full_name ?? usuario.user_metadata?.name;
  const nombre = typeof nombreMetadata === 'string' && nombreMetadata.trim()
    ? nombreMetadata.trim()
    : usuario.email.split('@')[0] ?? usuario.email;

  return { id: usuario.id, nombre, correo: usuario.email };
}

export async function exigirContador(): Promise<{ id: string; nombre: string; correo: string }> {
  const contador = await obtenerContador();
  if (!contador) throw new ErrorDeNegocio('NO_AUTORIZADO');
  return contador;
}
