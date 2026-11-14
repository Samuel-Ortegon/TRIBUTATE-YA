'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ahoraBogota } from '@/lib/reglas/fechas';
import {
  esquemaAgendarPublico,
  esquemaConsultaFechaLimite,
  esquemaRegistroCliente,
  esquemaVerificacionCliente,
} from '@/lib/validacion/esquemas';
import type { EstadoTramite } from '@/lib/reglas/estados';
import { ETIQUETA_ESTADO } from '@/lib/reglas/estados';
import { formatearFechaLarga, formatearPesos } from '@/lib/formato';
import { INSTRUCCIONES_PAGO } from '@/lib/config/negocio';

type DatosAPI = { ok?: boolean; datos?: Record<string, unknown>; error?: { mensaje?: string } };
async function postJson(ruta: string, datos: unknown): Promise<DatosAPI> {
  const respuesta = await fetch(ruta, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(datos),
  });
  const resultado = await respuesta.json() as DatosAPI;
  if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo completar la solicitud.');
  return resultado;
}

export function FormularioRegistro() {
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError(''); setMensaje('');
    const formulario = evento.currentTarget;
    const form = new FormData(evento.currentTarget);
    const datos = {
      cc: String(form.get('cc') ?? ''), nombre: String(form.get('nombre') ?? ''),
      telefono: String(form.get('telefono') ?? ''), correo: String(form.get('correo') ?? ''),
      aceptaTratamientoDatos: form.get('acepta') === 'on',
    };
    const validacion = esquemaRegistroCliente.safeParse(datos);
    if (!validacion.success) { setError(validacion.error.issues[0]?.message ?? 'Revise los datos.'); return; }
    setOcupado(true);
    try {
      await postJson('/api/publico/clientes', validacion.data);
      setMensaje('Su registro fue recibido. Ya puede consultar una fecha límite o solicitar una cita.');
      formulario.reset();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo completar el registro.');
    } finally { setOcupado(false); }
  }
  return <form className="stack-form form-card" onSubmit={(evento) => void enviar(evento)}>
    <label>Cédula<input name="cc" inputMode="numeric" required /></label>
    <label>Nombre completo<input name="nombre" required minLength={3} maxLength={120} /></label>
    <label>Teléfono<input name="telefono" inputMode="tel" required /></label>
    <label>Correo electrónico<input name="correo" type="email" required maxLength={160} /></label>
    <label className="checkbox-row"><input name="acepta" type="checkbox" required /> Autorizo el tratamiento de mis datos personales para gestionar mi consulta tributaria y contactarme sobre ella, conforme a la Ley 1581 de 2012.</label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {mensaje && <p className="notice notice-success" role="status">{mensaje}</p>}
    <button className="button button-primary" disabled={ocupado}>{ocupado ? 'Enviando…' : 'Registrarme'}</button>
  </form>;
}

export function FormularioConsulta() {
  const [resultado, setResultado] = useState<{ fechaLimite: string | null; estado: string; diasRestantes: number | null } | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function consultar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError(''); setResultado(null);
    const cc = String(new FormData(evento.currentTarget).get('cc') ?? '');
    const valido = esquemaConsultaFechaLimite.safeParse({ cc });
    if (!valido.success) { setError(valido.error.issues[0]?.message ?? 'Revise la cédula.'); return; }
    setOcupado(true);
    try {
      const datos = (await postJson('/api/publico/fecha-limite', valido.data)).datos;
      if (!datos) throw new Error('La respuesta del sistema está incompleta.');
      setResultado(datos as { fechaLimite: string | null; estado: string; diasRestantes: number | null });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo consultar la fecha límite.');
    } finally { setOcupado(false); }
  }
  return <>
    <form className="stack-form form-card" onSubmit={(evento) => void consultar(evento)}>
      <label>Número de cédula<input name="cc" inputMode="numeric" required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={ocupado}>{ocupado ? 'Consultando…' : 'Consultar fecha'}</button>
    </form>
    {resultado && <div className="panel-card result-card">
      <h2>Resultado</h2>
      <p>{resultado.fechaLimite ? `Fecha límite: ${formatearFechaLarga(resultado.fechaLimite)}` : 'No hay una fecha límite registrada para esta cédula.'}</p>
      <p>Estado: {resultado.estado.replaceAll('_', ' ')}</p>
    </div>}
  </>;
}

type CitaPublica = {
  fecha: string;
  hora: string;
  horaFin: string;
  valor: number;
  estadoPago: 'pendiente' | 'pagada' | 'requiere_revision';
};
export function FlujoAgendamiento() {
  const [credenciales, setCredenciales] = useState<{ cc: string; ultimos4: string } | null>(null);
  const [estado, setEstado] = useState<EstadoTramite | null>(null);
  const [cita, setCita] = useState<CitaPublica | null>(null);
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [hora, setHora] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const hoy = ahoraBogota().fecha;

  async function verificar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError(''); setOcupado(true);
    const form = new FormData(evento.currentTarget);
    const datos = { cc: String(form.get('cc') ?? ''), ultimos4: String(form.get('ultimos4') ?? '') };
    const valido = esquemaVerificacionCliente.safeParse(datos);
    if (!valido.success) { setError(valido.error.issues[0]?.message ?? 'Revise sus datos.'); setOcupado(false); return; }
    try {
      const r = (await postJson('/api/publico/mi-cita', valido.data)).datos;
      if (!r) throw new Error('La respuesta del sistema está incompleta.');
      setCredenciales(datos);
      setEstado(r.estadoTramite as EstadoTramite);
      setCita(r.cita as CitaPublica | null);
      setConfirmacion('');
    } catch (causa) { setError(causa instanceof Error ? causa.message : 'No se pudieron verificar los datos.'); }
    finally { setOcupado(false); }
  }

  async function cargarHorarios(nuevaFecha: string) {
    setFecha(nuevaFecha); setHora(''); setHorarios([]); setError('');
    if (!nuevaFecha) return;
    try {
      const respuesta = await fetch(`/api/publico/disponibilidad?fecha=${encodeURIComponent(nuevaFecha)}`);
      const datos = await respuesta.json() as DatosAPI;
      if (!respuesta.ok) throw new Error(datos.error?.mensaje ?? 'No se pudo consultar la agenda.');
      setHorarios((datos.datos?.horarios as string[]) ?? []);
    } catch (causa) { setError(causa instanceof Error ? causa.message : 'No se pudo consultar la agenda.'); }
  }

  async function agendar() {
    if (!credenciales || !hora) return;
    const validado = esquemaAgendarPublico.safeParse({ ...credenciales, fecha, hora });
    if (!validado.success) { setError(validado.error.issues[0]?.message ?? 'Seleccione una fecha y una hora.'); return; }
    setError(''); setOcupado(true);
    try {
      const r = (await postJson('/api/publico/citas', validado.data)).datos;
      if (!r) throw new Error('La respuesta del sistema está incompleta.');
      setCita({ ...(r as CitaPublica), estadoPago: 'pendiente' });
      setEstado('cita_agendada');
      setConfirmacion(String(r.instruccionesPago ?? INSTRUCCIONES_PAGO));
    } catch (causa) { setError(causa instanceof Error ? causa.message : 'No se pudo agendar la cita.'); }
    finally { setOcupado(false); }
  }

  async function cancelar() {
    if (!credenciales) return;
    setError(''); setOcupado(true);
    try {
      await postJson('/api/publico/mi-cita/cancelar', credenciales);
      setCita(null); setEstado('registrado'); setConfirmacion('Su cita fue cancelada.');
    } catch (causa) { setError(causa instanceof Error ? causa.message : 'No se pudo cancelar la cita.'); }
    finally { setOcupado(false); }
  }

  async function reprogramar() {
    if (!credenciales || !hora) return;
    const validado = esquemaAgendarPublico.safeParse({ ...credenciales, fecha, hora });
    if (!validado.success) {
      setError(validado.error.issues[0]?.message ?? 'Seleccione una fecha y una hora.');
      return;
    }

    setError('');
    setOcupado(true);
    try {
      const datos = (await postJson('/api/publico/mi-cita/reprogramar', validado.data)).datos;
      if (!datos?.cita) throw new Error('La respuesta del sistema está incompleta.');
      setCita(datos.cita as CitaPublica);
      setFecha('');
      setHora('');
      setHorarios([]);
      setConfirmacion('Su cita fue reprogramada. El pago se conserva.');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo reprogramar la cita.');
    } finally {
      setOcupado(false);
    }
  }

  return <div className="public-flow">
    {!credenciales && <form className="stack-form form-card" onSubmit={(evento) => void verificar(evento)}>
      <p>Verifique su identidad con la cédula registrada y los últimos cuatro dígitos de su teléfono.</p>
      <label>Cédula<input name="cc" inputMode="numeric" required /></label>
      <label>Últimos cuatro dígitos del teléfono<input name="ultimos4" inputMode="numeric" maxLength={4} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={ocupado}>{ocupado ? 'Verificando…' : 'Continuar'}</button>
    </form>}
    {credenciales && <>
      {estado && <p className="notice notice-info">Estado del trámite: {ETIQUETA_ESTADO[estado]}.</p>}
      {cita ? <section className="panel-card">
        <h2>Su cita</h2><p>{formatearFechaLarga(cita.fecha)} · {cita.hora} a {cita.horaFin}</p>
        <p>Valor: {formatearPesos(cita.valor)} · Pago: {
          cita.estadoPago === 'pagada' ? 'Pagado' :
            cita.estadoPago === 'requiere_revision' ? 'En revisión' : 'Pendiente'
        }</p>
        {cita.estadoPago === 'pendiente' ? (
          <button className="button button-quiet" type="button" disabled={ocupado} onClick={() => void cancelar()}>
            {ocupado ? 'Procesando…' : 'Cancelar cita'}
          </button>
        ) : (
          <div className="stack-form">
            <p className="muted-text">
              {cita.estadoPago === 'pagada'
                ? 'Puede cambiar la fecha y la hora; el pago se conserva.'
                : 'Su pago está en revisión. Puede cambiar la fecha y la hora; no es posible cancelar la cita.'}
            </p>
            <label>Fecha<input type="date" min={hoy} value={fecha} onChange={(evento) => void cargarHorarios(evento.target.value)} required /></label>
            <fieldset><legend>Horarios disponibles</legend>
              {horarios.length ? <div className="slot-grid">{horarios.map((slot) => (
                <button key={slot} type="button" className={`slot-button ${hora === slot ? 'slot-selected' : ''}`} onClick={() => setHora(slot)}>{slot}</button>
              ))}</div> : fecha
                ? <p className="muted-text">No hay horarios disponibles para esta fecha.</p>
                : <p className="muted-text">Seleccione una fecha para ver los horarios.</p>}
            </fieldset>
            <p className="muted-text">La nueva cita debe tener al menos 2 horas de anticipación y estar dentro de los próximos 30 días.</p>
            <button className="button button-primary" type="button" disabled={!hora || ocupado} onClick={() => void reprogramar()}>
              {ocupado ? 'Reprogramando…' : 'Reprogramar cita'}
            </button>
          </div>
        )}
      </section> : estado === 'registrado' && <>
        <section className="form-card stack-form">
          <label>Fecha<input type="date" value={fecha} onChange={(evento) => void cargarHorarios(evento.target.value)} required /></label>
          <fieldset><legend>Horarios disponibles</legend>
            {horarios.length ? <div className="slot-grid">{horarios.map((slot) => <button key={slot} type="button" className={`slot-button ${hora === slot ? 'slot-selected' : ''}`} onClick={() => setHora(slot)}>{slot}</button>)}
            </div> : fecha ? <p className="muted-text">No hay horarios disponibles para esta fecha.</p> : <p className="muted-text">Seleccione una fecha para ver los horarios.</p>}
          </fieldset>
          <button className="button button-primary" type="button" disabled={!hora || ocupado} onClick={() => void agendar()}>{ocupado ? 'Agendando…' : 'Confirmar cita'}</button>
        </section>
      </>}
      {confirmacion && <p className="notice notice-success" role="status">{confirmacion}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </>}
    <p className="muted-text">¿Aún no se ha registrado? <Link href="/registro">Regístrese aquí</Link>.</p>
  </div>;
}
