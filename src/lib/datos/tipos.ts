import type { CambiosCliente as CambiosClienteValidado, RegistroCliente } from '@/lib/validacion/esquemas';
import type { EstadoFecha } from '@/lib/reglas/fechas';
import type { AccionContador, EstadoTramite, ResultadoRevision } from '@/lib/reglas/estados';
import type { EstadoPago, TipoPago } from '@/lib/reglas/pagos';
import type { RangoCalendario } from '@/lib/reglas/calendario';

export type DatosRegistroCliente = RegistroCliente;
export type CambiosCliente = CambiosClienteValidado;
export type ClienteBasico = { id: string; estado: EstadoTramite };
export type FilaCliente = {
  id: string; nombre: string; ccEnmascarada: string; telefono: string; estado: EstadoTramite;
  fechaLimite: string | null; estadoFecha: EstadoFecha; diasRestantes: number | null;
};
export type DetalleCliente = {
  cliente: {
    id: string; cc: string; nombre: string; telefono: string; correo: string;
    estado: EstadoTramite; origenRegistro: 'cliente' | 'contador'; creadoEn: string;
  };
  fecha: {
    fechaLimite: string | null; origen: 'manual' | 'calendario' | 'sin_informacion';
    estado: EstadoFecha; diasRestantes: number | null; fechaManual: string | null;
  };
  citas: Array<{
    id: number; fecha: string; hora: string; horaFin: string; valor: number;
    estadoCita: string; estadoPago: string; origen: string; motivoCancelacion: string | null;
  }>;
  pagos: Array<{
    id: number; tipo: TipoPago; citaId: number | null; monto: number; valorEsperado: number;
    metodo: string; referencia: string | null; estado: EstadoPago; fechaPago: string; observacion: string | null;
  }>;
  revision: {
    id: number; citaId: number; resultado: ResultadoRevision;
    observaciones: string | null; fechaRevision: string;
  } | null;
  eventos: Array<{
    id: number; tipo: string; estadoAnterior: string | null; estadoNuevo: string | null;
    actor: string; detalle: Record<string, unknown>; creadoEn: string;
  }>;
  acciones: AccionContador[];
  puedeIniciarTramite: boolean;
};
export type ResultadoFechaLimite = { fechaLimite: string | null; estado: EstadoFecha; diasRestantes: number | null };
export type FilaCalendario = RangoCalendario & { id: number; esDemo: boolean };
export type CitaResumen = {
  id: number; fecha: string; hora: string; horaFin: string; valor: number; estadoPago: string;
};
export type FilaCita = {
  id: number; clienteId: string; nombre: string; fecha: string; hora: string; horaFin: string;
  valor: number; estadoCita: string; estadoPago: string;
};
export type DatosPago = {
  clienteId: string; tipo: TipoPago; citaId?: number; monto: number;
  metodo: string; referencia?: string; fechaPago: string;
};
export type FilaPago = {
  id: number; clienteId: string; nombre: string; tipo: TipoPago; monto: number;
  valorEsperado: number; diferencia: number; metodo: string; fechaPago: string;
};
export type ResumenPanel = {
  porEstado: Record<EstadoTramite, number>; citasHoy: FilaCita[];
  pagosEnRevision: number; totalClientes: number;
};
