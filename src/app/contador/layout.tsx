import { redirect } from 'next/navigation';
import { obtenerContador } from '@/lib/auth/sesionContador';
import { NavegacionPanel } from '@/components/contador/NavegacionPanel';

export const dynamic = 'force-dynamic';
export default async function ContadorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const contador = await obtenerContador();
  if (!contador) redirect('/login');
  return (
    <div className="panel-shell">
      <NavegacionPanel nombre={contador.nombre} />
      <main className="panel-main">{children}</main>
    </div>
  );
}
