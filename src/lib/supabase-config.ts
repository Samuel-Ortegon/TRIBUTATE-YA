export function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.TRIBUTATE_YA_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_TRIBUTATE_YA_TRIBUTATE_YASUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_TRIBUTATE_YA_TRIBUTATE_YASUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_TRIBUTATE_YA_TRIBUTATE_YASUPABASE_PUBLISHABLE_KEY ??
    process.env.TRIBUTATE_YA_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publicKey) return null;
  return { url: url.replace(/\/$/, ''), publicKey };
}

export function getSupabaseAdminKey() {
  return (
    process.env.TRIBUTATE_YA_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.TRIBUTATE_YA_SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    null
  );
}