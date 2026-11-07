'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FilaPago } from '@/lib/datos/tipos';
import { formatearPesos } from '@/lib/formato';

export function TablaPagosRevision({ pagos }: { pagos: FilaPago[] }) {
  const router = useRouter();
  const [dialogo, setDialogo] = useState<{ id: number; decision: 'aprobar' | 'anular' } | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function resolver(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dialogo) return;
    setOcupado(true); setError('');
    const observacion = String(new FormData(evento.currentTarget).get('observacion') ?? '');
    try {
      const respuesta = await fetch(`/api/contador/pagos/${dialogo.id}/${dialogo.decision}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ observacion }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo resolver el pago.');
      setDialogo(null); router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo resolver el pago.');
    } finally { setOcupado(false); }
  }
  return <>
    {pagos.length ? <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Tipo</th><th>Monto</th><th>Esperado</th><th>Diferencia</th><th>Método</th><th>Fecha</th><th>Acciones</th></tr></thead>
      <tbody>{pagos.map((pago) => <tr key={pago.id}><td>{pago.nombre}</td><td>{pago.tipo === 'primera_consulta' ? 'Primera consulta' : 'Servicio completo'}</td>
        <td>{formatearPesos(pago.monto)}</td><td>{formatearPesos(pago.valorEsperado)}</td><td>{formatearPesos(pago.diferencia)}</td><td>{pago.metodo}</td><td>{pago.fechaPago}</td>
        <td className="table-actions"><button className="button button-small button-primary" onClick={() => setDialogo({ id: pago.id, decision: 'aprobar' })}>Aprobar</button>
          <button className="button button-small button-quiet" onClick={() => setDialogo({ id: pago.id, decision: 'anular' })}>Anular</button></td></tr>)}</tbody></table></div>
      : <div className="empty-state"><h3>No hay pagos por revisar</h3><p>Los pagos que exceden el valor esperado aparecerán aquí.</p></div>}
    {dialogo && <div className="modal-backdrop"><section className="dialog-card" role="dialog" aria-modal="true">
      <h2>{dialogo.decision === 'aprobar' ? 'Aprobar pago' : 'Anular pago'}</h2>
      <form className="stack-form" onSubmit={(evento) => void resolver(evento)}>
        <label>Observación<textarea name="observacion" required minLength={10} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setDialogo(null)}>Volver</button>
          <button className="button button-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Confirmar'}</button></div>
      </form>
    </section></div>}
  </>;
}
