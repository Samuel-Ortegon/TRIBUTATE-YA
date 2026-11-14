import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obtenerDetalleCliente, type DetalleCliente } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { formatearFechaLarga, formatearPesos } from '@/lib/formato';
import { InsigniaEstado, InsigniaFecha } from '@/components/contador/Insignias';
import { PanelAcciones } from '@/components/contador/PanelAcciones';
import { TablaPagosCliente } from '@/components/contador/TablaPagosCliente';
import { LineaDeTiempo } from '@/components/contador/LineaDeTiempo';
import { NotasCliente } from '@/components/contador/NotasCliente';

export const dynamic = 'force-dynamic';
export default async function DetalleClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  let detalle: DetalleCliente;
  try { detalle = await obtenerDetalleCliente(id); }
  catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'CLIENTE_NO_ENCONTRADO') notFound();
    throw error;
  }
  return <div className="page-content">
    <header className="page-heading">
      <div><p className="eyebrow"><Link href="/contador/clientes">Clientes</Link> / Detalle</p><h1>{detalle.cliente.nombre}</h1><InsigniaEstado estado={detalle.cliente.estado} /></div>
    </header>
    <section className="detail-grid">
      <article className="panel-card"><h2>Datos del cliente</h2>
        <dl className="details-list">
          <div><dt>Cédula</dt><dd>{detalle.cliente.cc}</dd></div><div><dt>Teléfono</dt><dd>{detalle.cliente.telefono}</dd></div>
          <div><dt>Correo</dt><dd>{detalle.cliente.correo}</dd></div><div><dt>Registro</dt><dd>{detalle.cliente.origenRegistro}</dd></div>
          <div><dt>Fecha límite</dt><dd>{detalle.fecha.fechaLimite ? formatearFechaLarga(detalle.fecha.fechaLimite) : 'Sin información'}</dd></div>
          <div><dt>Origen de fecha</dt><dd>{detalle.fecha.origen}</dd></div>
        </dl><InsigniaFecha estado={detalle.fecha.estado} dias={detalle.fecha.diasRestantes} />
      </article>
      <PanelAcciones detalle={detalle} />
    </section>
    <section className="panel-card"><h2>Citas</h2>
      {detalle.citas.length ? <div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Valor</th><th>Estado</th><th>Pago</th></tr></thead>
        <tbody>{detalle.citas.map((cita) => <tr key={cita.id}><td>{formatearFechaLarga(cita.fecha)}</td><td>{cita.hora}–{cita.horaFin}</td><td>{formatearPesos(cita.valor)}</td><td>{cita.estadoCita}</td><td>{cita.estadoPago}</td></tr>)}</tbody></table></div>
        : <p className="muted-text">Sin citas registradas.</p>}
    </section>
    <section className="panel-card"><h2>Pagos</h2>
      <TablaPagosCliente pagos={detalle.pagos} />
    </section>
    <section className="panel-card"><h2>Revisión</h2>
      {detalle.revision ? <div><p>Resultado: <strong>{detalle.revision.resultado === 'debe_declarar' ? 'Debe declarar' : 'No debe declarar'}</strong></p><p>{detalle.revision.observaciones || 'Sin observaciones'}</p><p>{formatearFechaLarga(detalle.revision.fechaRevision)}</p></div> : <p className="muted-text">Sin revisión registrada.</p>}
    </section>
    <NotasCliente clienteId={detalle.cliente.id} notas={detalle.notas} />
    <section className="panel-card"><h2>Historial</h2><LineaDeTiempo eventos={detalle.eventos} /></section>
  </div>;
}
