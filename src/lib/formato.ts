import type { EstadoFecha } from '@/lib/reglas/fechas';
import { ETIQUETA_ESTADO, type EstadoTramite } from '@/lib/reglas/estados';
import type { EventoCliente } from '@/lib/datos/tipos';

export function formatearPesos(monto: number): string {
  const valor = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(monto);
  return `$ ${valor}`;
}

export function formatearFechaLarga(fecha: string): string {
  const fechaUTC = new Date(`${fecha}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(fechaUTC);
}

export function formatearHora(hora: string): string {
  const [horasTexto, minutos] = hora.split(':');
  const horas = Number(horasTexto);
  const horas12 = horas % 12 || 12;
  const periodo = horas < 12 ? 'a. m.' : 'p. m.';
  return `${horas12}:${minutos} ${periodo}`;
}

export function formatearFechaHora(fechaHora: string): string {
  const [fecha, hora] = fechaHora.split(' ');
  if (!fecha || !hora) return fechaHora;
  return `${formatearFechaLarga(fecha)} · ${formatearHora(hora)}`;
}

function valorTexto(detalle: Record<string, unknown>, clave: string): string | null {
  const valor = detalle[clave];
  return typeof valor === 'string' && valor ? valor : null;
}

function resultadoRevision(resultado: string | null): string {
  if (resultado === 'debe_declarar') return 'Debe declarar';
  if (resultado === 'no_debe_declarar') return 'No debe declarar';
  return resultado ?? 'sin resultado';
}

export function describirEvento(
  evento: Pick<EventoCliente, 'tipo' | 'detalle' | 'estadoAnterior' | 'estadoNuevo'>,
): string {
  const { tipo, detalle } = evento;
  switch (tipo) {
    case 'CLIENTE_REGISTRADO':
      return 'Cliente registrado';
    case 'DATOS_ACTUALIZADOS': {
      const campos = detalle.camposActualizados;
      return Array.isArray(campos) && campos.every((campo) => typeof campo === 'string')
        ? `Datos actualizados: ${campos.join(', ')}`
        : 'Datos del cliente actualizados';
    }
    case 'CITA_AGENDADA':
      return `Cita agendada para ${valorTexto(detalle, 'fecha') ?? 'fecha no disponible'} a las ${valorTexto(detalle, 'hora') ?? 'hora no disponible'}`;
    case 'CITA_REPROGRAMADA':
      return `Cita reprogramada de ${valorTexto(detalle, 'fechaAnterior') ?? 'fecha anterior'} ${valorTexto(detalle, 'horaAnterior') ?? ''} a ${valorTexto(detalle, 'fecha') ?? 'fecha nueva'} ${valorTexto(detalle, 'hora') ?? ''}`.trim();
    case 'CITA_CANCELADA':
      return `Cita cancelada${valorTexto(detalle, 'motivo') ? `: ${valorTexto(detalle, 'motivo')}` : ''}`;
    case 'PAGO_REGISTRADO': {
      const tipoPago = valorTexto(detalle, 'tipo') === 'primera_consulta'
        ? 'primera consulta'
        : 'servicio completo';
      const monto = detalle.monto;
      const estado = valorTexto(detalle, 'estado')?.replaceAll('_', ' ') ?? 'sin estado';
      return `Pago de ${tipoPago} registrado${typeof monto === 'number' ? ` por ${formatearPesos(monto)}` : ''}: ${estado}`;
    }
    case 'PAGO_APROBADO':
      return 'Pago aprobado';
    case 'PAGO_ANULADO':
      return `Pago anulado${valorTexto(detalle, 'motivo') ? `: ${valorTexto(detalle, 'motivo')}` : ''}`;
    case 'REVISION_REGISTRADA':
      return `Revisión registrada: ${resultadoRevision(evento.estadoNuevo)}`;
    case 'REVISION_CORREGIDA':
      return `Revisión corregida: ${resultadoRevision(valorTexto(detalle, 'resultadoAnterior'))} → ${resultadoRevision(valorTexto(detalle, 'resultadoNuevo'))}${valorTexto(detalle, 'motivo') ? `. Motivo: ${valorTexto(detalle, 'motivo')}` : ''}`;
    case 'TRAMITE_INICIADO':
      return 'Trámite iniciado';
    case 'NOTA_AGREGADA':
      return 'Nota del contador agregada';
    default:
      return tipo.replaceAll('_', ' ').toLowerCase();
  }
}

export function etiquetaEstadoTramite(estado: string): string {
  return estado in ETIQUETA_ESTADO
    ? ETIQUETA_ESTADO[estado as EstadoTramite]
    : estado.replaceAll('_', ' ');
}

export function textoDiasRestantes(estado: EstadoFecha, dias: number | null): string {
  if (estado === 'sin_informacion' || dias === null) return 'Sin fecha registrada';
  if (estado === 'vence_hoy') return 'Vence hoy';
  if (estado === 'vencida') {
    const diasVencidos = Math.abs(dias);
    return `Venció hace ${diasVencidos} ${diasVencidos === 1 ? 'día' : 'días'}`;
  }
  return dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`;
}
