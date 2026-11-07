'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DetalleCliente } from '@/lib/dataService';
import { formatearPesos } from '@/lib/formato';

type PagoCliente = DetalleCliente['pagos'][number];
export function TablaPagosCliente({ pagos }: { pagos: PagoCliente[] }) {
  const router = useRouter();
  const [dialogo, setDialogo] = useState<{ id: number; accion: 'aprobar' | 'anular' } | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  async function resolver(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dialogo) return;
    setGuardando(true); setError('');
    const observacion = String(new FormData(evento.currentTarget).get('observacion') ?? '');
    try {
      const respuesta = await fetch(`/api/contador/pagos/${dialogo.id}/${dialogo.accion}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ observacion }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo resolver el pago.');
      setDialogo(null); router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo resolver el pago.');
    } finally { setGuardando(false); }
  }
  return <>
    {pagos.length ? <div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Esperado</th><th>Método</th><th>Estado</th><th>Observación</th><th>Acciones</th></tr></thead>
      <tbody>{pagos.map((pago) => <tr key={pago.id}>
        <td>{pago.fechaPago}</td><td>{pago.tipo === 'primera_consulta' ? 'Primera consulta' : 'Servicio completo'}</td>
        <td>{formatearPesos(pago.monto)}</td><td>{formatearPesos(pago.valorEsperado)}</td><td>{pago.metodo}</td><td>{pago.estado}</td><td>{pago.observacion ?? '—'}</td>
        <td className="table-actions">{pago.estado === 'requiere_revision' && <button className="button button-small button-primary" type="button" onClick={() => setDialogo({ id: pago.id, accion: 'aprobar' })}>Aprobar</button>}
          {(pago.estado === 'requiere_revision' || pago.estado === 'pendiente') && <button className="button button-small button-quiet" type="button" onClick={() => setDialogo({ id: pago.id, accion: 'anular' })}>Anular</button>}</td>
      </tr>)}</tbody></table></div> : <p className="muted-text">Sin pagos registrados.</p>}
    {dialogo && <div className="modal-backdrop"><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="pago-dialogo-titulo">
      <h2 id="pago-dialogo-titulo">{dialogo.accion === 'aprobar' ? 'Aprobar pago' : 'Anular pago'}</h2>
      <form className="stack-form" onSubmit={(evento) => void resolver(evento)}>
        <label>Observación<textarea name="observacion" required minLength={10} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setDialogo(null)}>Volver</button>
          <button className="button button-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Confirmar'}</button></div>
      </form>
    </section></div>}
  </>;
}
