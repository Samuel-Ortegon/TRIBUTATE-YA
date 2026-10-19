'use client';

import { FormEvent, useState } from 'react';

type LoginMode = 'login' | 'changePassword';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<LoginMode>('login');

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: formData.get('email'), password: formData.get('password') }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? 'No se pudo iniciar sesión');
        return;
      }
      window.location.assign('/');
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordChangeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const currentPassword = String(formData.get('currentPassword') ?? '').trim();
    const newPassword = String(formData.get('newPassword') ?? '').trim();
    const confirmPassword = String(formData.get('confirmPassword') ?? '').trim();

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setError('Completa todos los campos para cambiar la contraseña');
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setError(result.error ?? 'No se pudo actualizar la contraseña');
        return;
      }
      setSuccess(result.message ?? 'La contraseña se actualizó correctamente.');
      event.currentTarget.reset();
      setMode('login');
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-aside" aria-label="Tributate Ya">
        <a className="login-brand" href="/" aria-label="Tributate Ya, inicio">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>tributa<span className="brand-light">teya</span></span>
        </a>
        <div className="aside-copy">
          <p className="eyebrow">GESTIÓN TRIBUTARIA</p>
          <h1>Todo en orden.<br />Todo en regla.</h1>
          <p className="aside-note">Tu espacio de trabajo, con acceso seguro a tu cuenta.</p>
        </div>
        <div className="aside-footer"><span className="status-dot" /> Acceso protegido</div>
      </section>

      <section className="login-main">
        <div className="login-form-wrap">
          <p className="eyebrow login-eyebrow">{mode === 'login' ? 'BIENVENIDO/A' : 'SEGURIDAD'}</p>
          <h2>{mode === 'login' ? 'Iniciar sesión' : 'Cambiar contraseña'}</h2>
          <p className="login-intro">
            {mode === 'login'
              ? 'Ingresa con el correo y la contraseña de tu cuenta.'
              : 'Introduce tu correo y la contraseña actual para establecer una nueva.'}
          </p>

          {mode === 'login' ? (
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" required />

              <label htmlFor="password">Contraseña</label>
              <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" required />

              {error && <p className="login-error" role="alert">{error}</p>}
              {success && <p className="login-success" role="status">{success}</p>}

              <button className="login-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Verificando…' : 'Entrar'}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handlePasswordChangeSubmit}>
              <label htmlFor="change-email">Correo electrónico</label>
              <input id="change-email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" required />

              <label htmlFor="currentPassword">Contraseña actual</label>
              <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" placeholder="Tu contraseña actual" required />

              <label htmlFor="newPassword">Nueva contraseña</label>
              <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" minLength={8} required />

              <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repite la nueva contraseña" minLength={8} required />

              {error && <p className="login-error" role="alert">{error}</p>}
              {success && <p className="login-success" role="status">{success}</p>}

              <button className="login-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          )}

          <button
            type="button"
            className="login-toggle"
            onClick={() => {
              setMode((currentMode) => (currentMode === 'login' ? 'changePassword' : 'login'));
              setError('');
              setSuccess('');
            }}
          >
            {mode === 'login' ? 'Cambiar contraseña' : 'Volver a iniciar sesión'}
          </button>

          <p className="login-footnote">La autenticación está protegida por Supabase.</p>
        </div>
        <footer className="login-legal">Tributate Ya <span>·</span> Acceso privado</footer>
      </section>
    </main>
  );
}