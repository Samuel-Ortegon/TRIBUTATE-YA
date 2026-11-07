'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const enlaces = [
  { href: '/contador', texto: 'Resumen' },
  { href: '/contador/clientes', texto: 'Clientes' },
  { href: '/contador/agenda', texto: 'Agenda' },
  { href: '/contador/pagos', texto: 'Pagos en revisión' },
  { href: '/contador/calendario', texto: 'Calendario tributario' },
];

export function NavegacionPanel({ nombre }: { nombre: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState('');
  async function cerrarSesion() {
    setError('');
    try {
      const respuesta = await fetch('/api/auth/logout', { method: 'POST' });
      if (!respuesta.ok) throw new Error('No fue posible cerrar la sesión.');
      router.replace('/login');
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No fue posible cerrar la sesión.');
    }
  }
  return (
    <>
      <button className="panel-menu" type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        {abierto ? 'Cerrar menú' : 'Menú'}
      </button>
      <aside className={`panel-nav ${abierto ? 'panel-nav-open' : ''}`}>
        <Link className="panel-brand" href="/contador"><span className="brand-mark">T</span>Tributate Ya</Link>
        <p className="panel-nav-label">Gestión tributaria</p>
        <nav aria-label="Navegación principal">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              className={`panel-nav-link ${ruta === enlace.href || (enlace.href !== '/contador' && ruta.startsWith(`${enlace.href}/`)) ? 'panel-nav-active' : ''}`}
              href={enlace.href}
              onClick={() => setAbierto(false)}
            >
              {enlace.texto}
            </Link>
          ))}
        </nav>
        <div className="panel-user">
          <span className="panel-user-name">{nombre}</span>
          {error && <span className="nav-error" role="alert">{error}</span>}
          <button className="button button-quiet" type="button" onClick={() => void cerrarSesion()}>Cerrar sesión</button>
        </div>
      </aside>
    </>
  );
}
