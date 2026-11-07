import Link from 'next/link';
import { obtenerResumen } from '@/lib/dataService';
import { ETIQUETA_ESTADO } from '@/lib/reglas/estados';
import { TarjetaIndicador } from '@/components/contador/TarjetaIndicador';
import { InsigniaEstado } from '@/components/contador/Insignias';

export const dynamic = 'force-dynamic';
export default async function ResumenContadorPage() {
  const resumen = await obtenerResumen();
  return (
    <div className="page-content">
      <header className="page-heading">
        <div><p className="eyebrow">Agenda tributaria</p><h1>Resumen</h1><p>Estado general de sus clientes y citas.</p></div>
      </header>
      <section className="indicator-grid" aria-label="Indicadores">
        <TarjetaIndicador titulo="Clientes" valor={resumen.totalClientes} href="/contador/clientes" />
        <TarjetaIndicador titulo="Citas de hoy" valor={resumen.citasHoy.length} href="/contador/agenda" />
        <TarjetaIndicador titulo="Pagos en revisión" valor={resumen.pagosEnRevision} href="/contador/pagos" />
        <TarjetaIndicador titulo="Trámites en proceso" valor={resumen.porEstado.en_proceso} href="/contador/clientes?estado=en_proceso" />
      </section>
      <section className="panel-card">
        <div className="section-heading"><div><p className="eyebrow">Seguimiento</p><h2>Clientes por estado</h2></div></div>
        <div className="status-grid">
          {(Object.keys(ETIQUETA_ESTADO) as Array<keyof typeof ETIQUETA_ESTADO>).map((estado) => (
            <Link className="status-tile" key={estado} href={`/contador/clientes?estado=${estado}`}>
              <InsigniaEstado estado={estado} /><strong>{resumen.porEstado[estado]}</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="panel-card">
        <div className="section-heading"><div><p className="eyebrow">Agenda diaria</p><h2>Citas de hoy</h2></div><Link className="text-link" href="/contador/agenda">Ver agenda</Link></div>
        {resumen.citasHoy.length ? (
          <div className="table-scroll"><table><thead><tr><th>Hora</th><th>Cliente</th><th>Estado de cita</th><th>Estado de pago</th></tr></thead>
            <tbody>{resumen.citasHoy.map((cita) => <tr key={cita.id}>
              <td>{cita.hora}–{cita.horaFin}</td><td><Link href={`/contador/clientes/${cita.clienteId}`}>{cita.nombre}</Link></td>
              <td>{cita.estadoCita}</td><td>{cita.estadoPago}</td>
            </tr>)}</tbody></table></div>
        ) : <div className="empty-state"><h3>No hay citas para hoy</h3><p>Las nuevas citas aparecerán en este resumen.</p></div>}
      </section>
    </div>
  );
}
