'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FilaCalendario } from '@/lib/dataService';

export function GestionCalendario({ rangos }: { rangos: FilaCalendario[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function solicitar(url: string, method: string, body?: unknown): Promise<boolean> {
    setError(''); setOcupado(true);
    try {
      const respuesta = await fetch(url, {
        method,
        ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo completar la operación.');
      router.refresh();
      return true;
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo completar la operación.');
      return false;
    } finally { setOcupado(false); }
  }
  async function agregar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const form = new FormData(formulario);
    const agregado = await solicitar('/api/contador/calendario', 'POST', {
      anioGravable: Number(form.get('anio')), digitoDesde: Number(form.get('desde')),
      digitoHasta: Number(form.get('hasta')), fechaLimite: form.get('fecha'),
    });
    if (agregado) formulario.reset();
  }
  const existenDemo = rangos.some((rango) => rango.esDemo);
  return <>
    {existenDemo && <div className="notice notice-warning">
      <p>Hay datos de demostración en el calendario.</p>
      <button className="button button-quiet" type="button" disabled={ocupado} onClick={() => void solicitar('/api/contador/calendario/demo', 'DELETE')}>Eliminar datos de demostración</button>
    </div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="table-scroll"><table><thead><tr><th>Año gravable</th><th>Dígitos desde</th><th>Dígitos hasta</th><th>Fecha límite</th><th>Tipo</th><th></th></tr></thead>
      <tbody>{rangos.map((rango) => <tr key={rango.id}><td>{rango.anioGravable}</td><td>{rango.digitoDesde}</td><td>{rango.digitoHasta}</td><td>{rango.fechaLimite}</td><td>{rango.esDemo ? 'Demostración' : 'Oficial'}</td>
        <td><button className="button button-small button-quiet" type="button" disabled={ocupado} onClick={() => void solicitar(`/api/contador/calendario/${rango.id}`, 'DELETE')}>Eliminar</button></td></tr>)}</tbody></table></div>
    {!rangos.length && <div className="empty-state"><h3>Calendario sin rangos</h3><p>Agregue las fechas del calendario tributario oficial para calcular fechas límite.</p></div>}
    <section className="subsection"><h2>Agregar rango de calendario</h2>
      <p className="muted-text">Cargue las fechas del calendario tributario oficial vigente para personas naturales, según los dos últimos dígitos del NIT o cédula.</p>
      <form className="calendar-form" onSubmit={(evento) => void agregar(evento)}>
        <label>Año gravable<input name="anio" type="number" min={2020} max={2100} required /></label>
        <label>Dígito desde<input name="desde" type="number" min={0} max={99} required /></label>
        <label>Dígito hasta<input name="hasta" type="number" min={0} max={99} required /></label>
        <label>Fecha límite<input name="fecha" type="date" required /></label>
        <button className="button button-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Agregar rango'}</button>
      </form>
    </section>
  </>;
}
