import Link from 'next/link';
import { listarCitas } from '@/lib/dataService';
import { ahoraBogota, sumarDias } from '@/lib/reglas/fechas';
import { formatearFechaLarga } from '@/lib/formato';
import { InsigniaEstado } from '@/components/contador/Insignias';

export const dynamic = 'force-dynamic';
export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const parametros = await searchParams;
  const fecha = parametros.fecha && /^\d{4}-\d{2}-\d{2}$/.test(parametros.fecha) ? parametros.fecha : ahoraBogota().fecha;
  const citas = await listarCitas(fecha, fecha);
  return <div className="page-content">
    <header className="page-heading">
      <div><p className="eyebrow">Agenda</p><h1>{formatearFechaLarga(fecha)}</h1><p>Revise y gestione las citas del día.</p></div>
      <Link className="button button-primary" href="/contador/clientes">Agendar desde un cliente</Link>
    </header>
    <nav className="date-nav" aria-label="Cambiar día">
      <Link className="button button-quiet" href={`/contador/agenda?fecha=${sumarDias(fecha, -1)}`}>Día anterior</Link>
      <Link className="button button-secondary" href={`/contador/agenda?fecha=${ahoraBogota().fecha}`}>Hoy</Link>
      <Link className="button button-quiet" href={`/contador/agenda?fecha=${sumarDias(fecha, 1)}`}>Día siguiente</Link>
    </nav>
    <section className="panel-card">
      {citas.length ? <div className="table-scroll"><table><thead><tr><th>Hora</th><th>Cliente</th><th>Estado de cita</th><th>Estado de pago</th><th>Acciones</th></tr></thead>
        <tbody>{citas.map((cita) => <tr key={cita.id}><td>{cita.hora}–{cita.horaFin}</td><td><Link href={`/contador/clientes/${cita.clienteId}`}>{cita.nombre}</Link></td>
          <td>{cita.estadoCita}</td><td>{cita.estadoPago}</td><td><Link className="text-link" href={`/contador/clientes/${cita.clienteId}`}>Ver cliente y gestionar</Link></td></tr>)}</tbody></table></div>
        : <div className="empty-state"><h3>No hay citas para esta fecha</h3><p>Seleccione otro día o agende una cita desde el detalle del cliente.</p></div>}
    </section>
  </div>;
}
