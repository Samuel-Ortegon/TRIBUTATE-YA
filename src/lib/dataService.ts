export {
  registrarCliente,
  verificarCliente,
  listarClientes,
  obtenerDetalleCliente,
  actualizarCliente,
  consultarFechaLimite,
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
} from '@/lib/datos/tipos';
