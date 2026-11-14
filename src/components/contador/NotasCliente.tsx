'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NotaCliente } from '@/lib/datos/tipos';
import { formatearFechaHora } from '@/lib/formato';

type Respuesta = { ok?: boolean; error?: { mensaje?: string } };

export function NotasCliente({ clienteId, notas }: { clienteId: string; notas: NotaCliente[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError('');
    setGuardando(true);
    const formulario = evento.currentTarget;
    const texto = String(new FormData(formulario).get('texto') ?? '').trim();
    try {
      const respuesta = await fetch(`/api/contador/clientes/${clienteId}/notas`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const resultado = await respuesta.json() as Respuesta;
      if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo guardar la nota.');
      formulario.reset();
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo guardar la nota.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="panel-card">
      <h2>Notas del contador</h2>
      <form className="stack-form note-form" onSubmit={(evento) => void guardar(evento)}>
        <label>Agregar nota
          <textarea name="texto" required minLength={3} maxLength={2000} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      </form>
      {notas.length ? <ol className="client-notes">
        {notas.map((nota) => (
          <li key={nota.id}>
            <time className="muted-text">{formatearFechaHora(nota.creadoEn)}</time>
            <p>{nota.texto}</p>
          </li>
        ))}
      </ol> : <p className="muted-text">Aún no hay notas.</p>}
    </section>
  );
}
