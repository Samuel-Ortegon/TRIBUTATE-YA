'use client';

import { FormEvent, useState } from 'react';

export default function PruebaCorreoFormulario() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');

  async function manejarEnvio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEstado('enviando');
    setMensaje('');

    try {
      const respuesta = await fetch('/api/correo/prueba', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ para: email }),
      });
      const cuerpo = (await respuesta.json()) as { error?: string; mensaje?: string };

      if (!respuesta.ok) {
        setEstado('error');
        setMensaje(cuerpo.error ?? 'No se pudo enviar el correo.');
        return;
      }

      setEstado('ok');
      setMensaje(cuerpo.mensaje ?? 'Correo enviado.');
      setEmail('');
    } catch {
      setEstado('error');
      setMensaje('No se pudo contactar con la API de correo.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f6f3', color: '#17251f', padding: '2rem' }}>
      <section style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 20px 45px rgba(23, 53, 45, 0.12)' }}>
        <p style={{ margin: 0, color: '#577b45', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Prueba de correo
        </p>
        <h1 style={{ margin: '0.8rem 0 0.75rem', fontSize: '2rem' }}>Enviar prueba</h1>

        <form onSubmit={manejarEnvio} style={{ display: 'grid', gap: '1rem' }}>
          <label htmlFor="email" style={{ fontWeight: 600 }}>Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tucorreo@ejemplo.com"
            required
            style={{ minHeight: '3rem', padding: '0 0.9rem', border: '1px solid #cad2cc', borderRadius: 6, font: 'inherit' }}
          />

          <button
            type="submit"
            disabled={estado === 'enviando'}
            style={{ minHeight: '3rem', border: 0, borderRadius: 6, background: '#17352d', color: '#fff', fontWeight: 700, cursor: estado === 'enviando' ? 'wait' : 'pointer' }}
          >
            {estado === 'enviando' ? 'Enviando…' : 'Enviar prueba'}
          </button>
        </form>

        {mensaje ? (
          <p
            role="status"
            style={{
              marginTop: '1rem',
              color: estado === 'ok' ? '#1f7a4d' : '#a3312b',
              fontWeight: 600,
            }}
          >
            {mensaje}
          </p>
        ) : null}
      </section>
    </main>
  );
}
