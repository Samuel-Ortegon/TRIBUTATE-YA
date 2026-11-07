'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { evaluarMonto, valorEsperado } from '@/lib/reglas/pagos';
import { ahoraBogota } from '@/lib/reglas/fechas';
import { TARIFA_PRIMERA_CONSULTA, TARIFA_SERVICIO_COMPLETO } from '@/lib/config/negocio';
import type { AccionContador } from '@/lib/reglas/estados';
import type { DetalleCliente } from '@/lib/datos/tipos';

const etiquetas: Record<AccionContador, string> = {
  EDITAR_DATOS: 'Editar datos',
  AGENDAR_CITA: 'Agendar cita',
  REPROGRAMAR_CITA: 'Reprogramar cita',
  CANCELAR_CITA: 'Cancelar cita',
  REGISTRAR_PAGO_CONSULTA: 'Registrar pago de consulta',
  REGISTRAR_REVISION: 'Registrar revisión',
  CORREGIR_REVISION: 'Corregir revisión',
  REGISTRAR_PAGO_SERVICIO: 'Registrar pago del servicio',
  INICIAR_TRAMITE: 'Iniciar trámite',
};
type EstadoRespuesta = { ok?: boolean; datos?: unknown; error?: { mensaje?: string } };

export function PanelAcciones({ detalle }: { detalle: DetalleCliente }) {
  const router = useRouter();
  const [accion, setAccion] = useState<AccionContador | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const dialogoRef = useRef<HTMLElement>(null);
  const citaActiva = detalle.citas.find((cita) => cita.estadoCita === 'agendada');
  const hoy = useMemo(() => ahoraBogota().fecha, []);
  const [fechaCita, setFechaCita] = useState('');
  const [horaCita, setHoraCita] = useState('');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const tarifa = accion === 'REGISTRAR_PAGO_SERVICIO' ? TARIFA_SERVICIO_COMPLETO : TARIFA_PRIMERA_CONSULTA;
  const [monto, setMonto] = useState(tarifa);

  useEffect(() => {
    if (accion) setMonto(accion === 'REGISTRAR_PAGO_SERVICIO' ? TARIFA_SERVICIO_COMPLETO : TARIFA_PRIMERA_CONSULTA);
  }, [accion]);
  useEffect(() => {
    if (!accion) return;
    const cerrarConEscape = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setAccion(null); };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [accion]);
  useEffect(() => {
    dialogoRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
  }, [accion]);
  useEffect(() => {
    if (!accion || (accion !== 'AGENDAR_CITA' && accion !== 'REPROGRAMAR_CITA') || !fechaCita) {
      setHorarios([]);
      return;
    }
    const controlador = new AbortController();
    setCargandoHorarios(true);
    fetch(`/api/contador/disponibilidad?fecha=${encodeURIComponent(fechaCita)}`, { signal: controlador.signal })
      .then(async (respuesta) => {
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudieron cargar los horarios.');
        return resultado.datos?.horarios as string[];
      })
      .then(setHorarios)
      .catch((causa: unknown) => {
        if (causa instanceof DOMException && causa.name === 'AbortError') return;
        setError(causa instanceof Error ? causa.message : 'No se pudieron cargar los horarios.');
      })
      .finally(() => { if (!controlador.signal.aborted) setCargandoHorarios(false); });
    return () => controlador.abort();
  }, [accion, fechaCita]);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!accion) return;
    setCargando(true);
    setError('');
    const datos = new FormData(evento.currentTarget);
    const campo = (nombre: string) => String(datos.get(nombre) ?? '');
    let url = `/api/contador/clientes/${detalle.cliente.id}`;
    let metodo = 'PATCH';
    let cuerpo: Record<string, unknown> = {};
    if (accion === 'EDITAR_DATOS') {
      cuerpo = {
        nombre: campo('nombre'), telefono: campo('telefono'), correo: campo('correo'),
        fechaLimiteManual: datos.get('usarCalendario') ? null : (campo('fechaLimiteManual') || null),
      };
    } else if (accion === 'AGENDAR_CITA') {
      if (!horaCita) { setError('Seleccione un horario o indique una hora manual.'); setCargando(false); return; }
      url = '/api/contador/citas'; metodo = 'POST';
      cuerpo = { clienteId: detalle.cliente.id, fecha: campo('fecha'), hora: campo('hora') };
    } else if (accion === 'REPROGRAMAR_CITA') {
      if (!citaActiva) { setError('No hay una cita activa para reprogramar.'); setCargando(false); return; }
      if (!horaCita) { setError('Seleccione un horario o indique una hora manual.'); setCargando(false); return; }
      url = `/api/contador/citas/${citaActiva.id}/reprogramar`; metodo = 'POST';
      cuerpo = { fecha: campo('fecha'), hora: campo('hora') };
    } else if (accion === 'CANCELAR_CITA') {
      if (!citaActiva) { setError('No hay una cita activa para cancelar.'); setCargando(false); return; }
      url = `/api/contador/citas/${citaActiva.id}/cancelar`; metodo = 'POST';
      cuerpo = { motivo: campo('motivo') };
    } else if (accion === 'REGISTRAR_PAGO_CONSULTA' || accion === 'REGISTRAR_PAGO_SERVICIO') {
      url = '/api/contador/pagos'; metodo = 'POST';
      cuerpo = {
        clienteId: detalle.cliente.id,
        tipo: accion === 'REGISTRAR_PAGO_SERVICIO' ? 'servicio_completo' : 'primera_consulta',
        monto: Number(campo('monto')), metodo: campo('metodo'), referencia: campo('referencia'),
        fechaPago: campo('fechaPago'),
        ...(accion === 'REGISTRAR_PAGO_CONSULTA' && citaActiva ? { citaId: citaActiva.id } : {}),
      };
    } else if (accion === 'REGISTRAR_REVISION') {
      if (!citaActiva) { setError('No hay una cita activa para registrar la revisión.'); setCargando(false); return; }
      url = '/api/contador/revisiones'; metodo = 'POST';
      cuerpo = { citaId: citaActiva.id, resultado: campo('resultado'), observaciones: campo('observaciones') };
    } else if (accion === 'CORREGIR_REVISION') {
      if (!detalle.revision) { setError('No hay una revisión para corregir.'); setCargando(false); return; }
      url = `/api/contador/revisiones/${detalle.revision.id}/corregir`; metodo = 'POST';
      cuerpo = { resultado: campo('resultado'), motivo: campo('motivo') };
    } else {
      url = `/api/contador/clientes/${detalle.cliente.id}/iniciar-tramite`; metodo = 'POST';
    }

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const resultado = await respuesta.json() as EstadoRespuesta;
      if (!respuesta.ok) throw new Error(resultado.error?.mensaje ?? 'No se pudo completar la operación.');
      setMensaje('La operación se completó correctamente.');
      setAccion(null);
      router.refresh();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo completar la operación.');
    } finally {
      setCargando(false);
    }
  }

  function contenidoFormulario() {
    switch (accion) {
      case 'EDITAR_DATOS':
        return <>
          <label>Nombre<input name="nombre" required minLength={3} maxLength={120} defaultValue={detalle.cliente.nombre} /></label>
          <label>Teléfono<input name="telefono" required defaultValue={detalle.cliente.telefono} /></label>
          <label>Correo<input name="correo" type="email" required defaultValue={detalle.cliente.correo} /></label>
          <label>Fecha límite manual<input name="fechaLimiteManual" type="date" defaultValue={detalle.fecha.fechaManual ?? ''} /></label>
          <label className="checkbox-row"><input name="usarCalendario" type="checkbox" /> Usar fecha del calendario tributario</label>
        </>;
      case 'AGENDAR_CITA':
      case 'REPROGRAMAR_CITA':
        return <>
          <label>Fecha<input name="fecha" type="date" required min={hoy} value={fechaCita} onChange={(evento) => { setFechaCita(evento.target.value); setHoraCita(''); }} /></label>
          <div className="availability-picker">
            <span className="field-label">Horarios disponibles</span>
            {cargandoHorarios ? <p className="muted-text">Consultando disponibilidad…</p>
              : horarios.length ? <div className="slot-grid">{horarios.map((slot) => <button key={slot} type="button" className={`slot-button ${horaCita === slot ? 'slot-selected' : ''}`} onClick={() => setHoraCita(slot)}>{slot}</button>)}
              </div> : fechaCita ? <p className="muted-text">No hay horarios disponibles para esta fecha.</p> : <p className="muted-text">Seleccione una fecha para consultar los horarios.</p>}
          </div>
          <label>Hora manual (opcional)<input type="time" step={300} value={horaCita} onChange={(evento) => setHoraCita(evento.target.value)} /></label>
          <input type="hidden" name="hora" value={horaCita} />
        </>;
      case 'CANCELAR_CITA':
        return <label>Motivo<textarea name="motivo" required minLength={10} maxLength={500} /></label>;
      case 'REGISTRAR_PAGO_CONSULTA':
      case 'REGISTRAR_PAGO_SERVICIO': {
        const estadoMonto = evaluarMonto(monto, valorEsperado(accion === 'REGISTRAR_PAGO_SERVICIO' ? 'servicio_completo' : 'primera_consulta'));
        const textoEstado = estadoMonto === 'confirmado' ? 'Se confirmará' : estadoMonto === 'pendiente' ? 'Quedará pendiente' : 'Quedará en revisión';
        return <>
          <label>Monto en pesos<input name="monto" type="number" step={1} min={1} required value={monto} onChange={(e) => setMonto(Number(e.target.value))} /></label>
          <label>Método<select name="metodo" required><option value="transferencia">Transferencia</option><option value="nequi">Nequi</option><option value="daviplata">Daviplata</option><option value="efectivo">Efectivo</option><option value="otro">Otro</option></select></label>
          <label>Referencia<input name="referencia" maxLength={80} /></label>
          <label>Fecha de pago<input name="fechaPago" type="date" required defaultValue={hoy} /></label>
          <p className="notice notice-info">Resultado esperado: {textoEstado}.</p>
        </>;
      }
      case 'REGISTRAR_REVISION':
        return <>
          <p className="muted-text">El sistema registra la decisión del contador; no la calcula.</p>
          <label>Resultado<select name="resultado"><option value="debe_declarar">Debe declarar</option><option value="no_debe_declarar">No debe declarar</option></select></label>
          <label>Observaciones<textarea name="observaciones" maxLength={2000} /></label>
        </>;
      case 'CORREGIR_REVISION':
        return <>
          <label>Nuevo resultado<select name="resultado" defaultValue={detalle.revision?.resultado === 'debe_declarar' ? 'no_debe_declarar' : 'debe_declarar'}><option value="debe_declarar">Debe declarar</option><option value="no_debe_declarar">No debe declarar</option></select></label>
          <label>Motivo<textarea name="motivo" required minLength={10} /></label>
        </>;
      case 'INICIAR_TRAMITE':
        return <div className="notice notice-info">
          <p>Resultado de revisión: {detalle.revision?.resultado === 'debe_declarar' ? 'Debe declarar' : 'No cumple'}</p>
          <p>Pago de servicio confirmado: {detalle.pagos.some((pago) => pago.tipo === 'servicio_completo' && pago.estado === 'confirmado') ? 'Sí' : 'No'}</p>
          <p>El trámite se inicia cuando se cumplen ambas condiciones.</p>
        </div>;
      default:
        return null;
    }
  }

  return (
    <section className="panel-card">
      <div className="section-heading"><div><p className="eyebrow">Gestión</p><h2>Siguiente paso</h2></div></div>
      {mensaje && <p className="notice notice-success" role="status">{mensaje}</p>}
      <div className="action-list">
        {detalle.acciones.map((accionDisponible) => (
          <button
            key={accionDisponible}
            className={accionDisponible === 'INICIAR_TRAMITE' ? 'button button-primary' : 'button button-secondary'}
            type="button"
            disabled={accionDisponible === 'INICIAR_TRAMITE' && !detalle.puedeIniciarTramite}
            onClick={() => {
              setError(''); setMensaje(''); setAccion(accionDisponible);
              if (accionDisponible === 'AGENDAR_CITA' || accionDisponible === 'REPROGRAMAR_CITA') {
                setFechaCita(''); setHoraCita('');
              }
            }}
          >
            {etiquetas[accionDisponible]}
          </button>
        ))}
      </div>
      {accion && (
        <div className="modal-backdrop" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) setAccion(null); }}>
          <section ref={dialogoRef} className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button type="button" className="dialog-close" onClick={() => setAccion(null)} aria-label="Cerrar">×</button>
            <p className="eyebrow">Operación de cliente</p>
            <h2 id="dialog-title">{etiquetas[accion]}</h2>
            <form className="stack-form" onSubmit={(evento) => void enviar(evento)}>
              {contenidoFormulario()}
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-actions">
                <button className="button button-quiet" type="button" onClick={() => setAccion(null)}>Volver</button>
                <button className="button button-primary" type="submit" disabled={cargando || (accion === 'INICIAR_TRAMITE' && !detalle.puedeIniciarTramite)}>
                  {cargando ? 'Guardando…' : 'Confirmar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
