import { NextResponse } from 'next/server';

export async function POST() {
  const respuesta = NextResponse.json({ cerrado: true });
  respuesta.cookies.set('supabase-access-token', '', { httpOnly: true, path: '/', maxAge: 0 });
  respuesta.cookies.set('supabase-refresh-token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return respuesta;
}
