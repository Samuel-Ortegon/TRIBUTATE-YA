'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function FormularioCliente() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setGuardando(true); setError('');
    const datos = new FormData(evento.currentTarget);
    try {
      const respuesta = await fetch('/api/contador/clientes', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          cc: datos.get('cc'), nombre: datos.get('nombre'), telefono: datos.get('telefono'),
          correo: datos.get('correo'), aceptaTratamientoDatos: datos.get('acepta') === 'on',
        }),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo registrar el cliente.');
      router.push(`/contador/clientes/${resultado.datos.id}`);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo registrar el cliente.');
    } finally { setGuardando(false); }
  }
  return <form className="stack-form form-card" onSubmit={(evento) => void guardar(evento)}>
    <label>Cédula<input name="cc" inputMode="numeric" pattern="[0-9]{6,10}" required /></label>
    <label>Nombre completo<input name="nombre" minLength={3} maxLength={120} required /></label>
    <label>Teléfono<input name="telefono" inputMode="tel" pattern="(3[0-9]{9}|60[0-9]{8})" required /></label>
    <label>Correo electrónico<input name="correo" type="email" maxLength={160} required /></label>
    <label className="checkbox-row"><input name="acepta" type="checkbox" required /> El cliente autorizó el tratamiento de sus datos personales</label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button className="button button-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Registrar cliente'}</button></div>
  </form>;
}
