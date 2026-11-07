'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { FilaCliente } from '@/lib/datos/tipos';
import { InsigniaEstado, InsigniaFecha } from '@/components/contador/Insignias';

export function TablaClientes({ clientes }: { clientes: FilaCliente[] }) {
  const router = useRouter();
  const ruta = usePathname();
  const parametros = useSearchParams();
  const busquedaActual = parametros.get('busqueda') ?? '';
  const [busqueda, setBusqueda] = useState(busquedaActual);
  useEffect(() => setBusqueda(busquedaActual), [busquedaActual]);
  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      const nuevos = new URLSearchParams(parametros.toString());
      if (busqueda.trim()) nuevos.set('busqueda', busqueda.trim());
      else nuevos.delete('busqueda');
      const query = nuevos.toString();
      if (query !== parametros.toString()) router.replace(query ? `${ruta}?${query}` : ruta);
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [busqueda, parametros, ruta, router]);

  return <>
    <label className="search-field">Buscar por nombre o cédula
      <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Escriba para buscar" />
    </label>
    {clientes.length ? (
      <>
        <div className="table-scroll desktop-table"><table><thead><tr><th>Nombre</th><th>Cédula</th><th>Teléfono</th><th>Estado</th><th>Fecha límite</th><th></th></tr></thead>
          <tbody>{clientes.map((cliente) => <tr key={cliente.id}>
            <td>{cliente.nombre}</td><td>{cliente.ccEnmascarada}</td><td>{cliente.telefono}</td>
            <td><InsigniaEstado estado={cliente.estado} /></td>
            <td><InsigniaFecha estado={cliente.estadoFecha} dias={cliente.diasRestantes} /></td>
            <td><Link className="text-link" href={`/contador/clientes/${cliente.id}`}>Ver</Link></td>
          </tr>)}</tbody></table></div>
        <div className="mobile-card-list">{clientes.map((cliente) => <article className="mobile-client-card" key={cliente.id}>
          <h3>{cliente.nombre}</h3><p>Cédula: {cliente.ccEnmascarada}</p><p>Teléfono: {cliente.telefono}</p>
          <InsigniaEstado estado={cliente.estado} /> <InsigniaFecha estado={cliente.estadoFecha} dias={cliente.diasRestantes} />
          <Link className="text-link" href={`/contador/clientes/${cliente.id}`}>Ver detalle</Link>
        </article>)}</div>
      </>
    ) : <div className="empty-state"><h3>No se encontraron clientes</h3><p>Pruebe con otra búsqueda o registre un nuevo cliente.</p></div>}
  </>;
}
