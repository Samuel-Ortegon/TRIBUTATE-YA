export {
  registrarCliente,
  verificarCliente,
  listarClientes,
  obtenerDetalleCliente,
  actualizarCliente,
  consultarFechaLimite,
  obtenerContactoCliente,
} from '@/lib/datos/clientes';
export {
  listarCalendario,
  agregarRangoCalendario,
  eliminarRangoCalendario,
  eliminarCalendarioDemo,
} from '@/lib/datos/calendario';
export {
  obtenerHorariosDisponibles,
  agendarCita,
  reprogramarCita,
  cancelarCita,
  obtenerCitaActiva,
  listarCitas,
  horarioFin,
} from '@/lib/datos/citas';
export { registrarPago, aprobarPago, anularPago, listarPagosEnRevision } from '@/lib/datos/pagos';
export { registrarRevision, corregirRevision, iniciarTramite } from '@/lib/datos/tramites';
export { obtenerResumen } from '@/lib/datos/resumen';
export { listarNotas, agregarNota } from '@/lib/datos/notas';
export type {
  DatosRegistroCliente,
  ClienteBasico,
  FilaCliente,
  DetalleCliente,
  CambiosCliente,
  ResultadoFechaLimite,
  FilaCalendario,
  CitaResumen,
  FilaCita,
  DatosPago,
  FilaPago,
  ResumenPanel,
  NotaCliente,
} from '@/lib/datos/tipos';
