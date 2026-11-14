import Link from 'next/link';
import { listarCitas } from '@/lib/dataService';
import { HORARIO_ATENCION } from '@/lib/config/negocio';
import { ahoraBogota, diaSemanaISO, horaAMinutos, minutosAHora, sumarDias } from '@/lib/reglas/fechas';
import { formatearFechaLarga } from '@/lib/formato';
import { esquemaFecha } from '@/lib/validacion/esquemas';

export const dynamic = 'force-dynamic';
type VistaAgenda = 'dia' | 'semana';

const HORAS_SEMANA_SIN_DUPLICADOS = Object.values(HORARIO_ATENCION).flatMap((bloques) => bloques.flatMap(([inicio, fin]) => {
  const horas: string[] = [];
  for (let minuto = horaAMinutos(inicio); minuto < horaAMinutos(fin); minuto += 30) {
    horas.push(minutosAHora(minuto));
  }
  return horas;
}));
const HORAS_SEMANA = Array.from(new Set(HORAS_SEMANA_SIN_DUPLICADOS))
  .sort((a, b) => horaAMinutos(a) - horaAMinutos(b));

function etiquetaDia(fecha: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00.000Z`));
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; vista?: string }>;
}) {
  const parametros = await searchParams;
  const resultadoFecha = esquemaFecha.safeParse(parametros.fecha);
  const fecha = resultadoFecha.success ? resultadoFecha.data : ahoraBogota().fecha;
  const vista: VistaAgenda = parametros.vista === 'semana' ? 'semana' : 'dia';
  const lunes = sumarDias(fecha, 1 - diaSemanaISO(fecha));
  const viernes = sumarDias(lunes, 4);
  const inicio = vista === 'semana' ? lunes : fecha;
  const fin = vista === 'semana' ? viernes : fecha;
  const citas = await listarCitas(inicio, fin);
  const diasSemana = Array.from({ length: 5 }, (_, indice) => sumarDias(lunes, indice));
  const citaPorCelda = new Map(citas.map((cita) => [`${cita.fecha} ${cita.hora}`, cita]));
  const titulo = vista === 'semana'
    ? `${formatearFechaLarga(lunes)} – ${formatearFechaLarga(viernes)}`
    : formatearFechaLarga(fecha);

  return <div className="page-content">
    <header className="page-heading">
      <div><p className="eyebrow">Agenda</p><h1>{titulo}</h1>
        <p>{vista === 'semana' ? 'Citas de lunes a viernes, en bloques de 30 minutos.' : 'Revise y gestione las citas del día.'}</p>
      </div>
      <Link className="button button-primary" href="/contador/clientes">Agendar desde un cliente</Link>
    </header>
    <nav className="date-nav" aria-label="Cambiar vista de agenda">
      <Link className={`button ${vista === 'dia' ? 'button-primary' : 'button-secondary'}`} href={`/contador/agenda?fecha=${fecha}&vista=dia`}>Día</Link>
      <Link className={`button ${vista === 'semana' ? 'button-primary' : 'button-secondary'}`} href={`/contador/agenda?fecha=${fecha}&vista=semana`}>Semana</Link>
      {vista === 'semana' ? <>
        <Link className="button button-quiet" href={`/contador/agenda?fecha=${sumarDias(lunes, -7)}&vista=semana`}>Semana anterior</Link>
        <Link className="button button-quiet" href={`/contador/agenda?fecha=${ahoraBogota().fecha}&vista=semana`}>Esta semana</Link>
        <Link className="button button-quiet" href={`/contador/agenda?fecha=${sumarDias(lunes, 7)}&vista=semana`}>Semana siguiente</Link>
      </> : <>
        <Link className="button button-quiet" href={`/contador/agenda?fecha=${sumarDias(fecha, -1)}&vista=dia`}>Día anterior</Link>
        <Link className="button button-quiet" href={`/contador/agenda?fecha=${ahoraBogota().fecha}&vista=dia`}>Hoy</Link>
        <Link className="button button-quiet" href={`/contador/agenda?fecha=${sumarDias(fecha, 1)}&vista=dia`}>Día siguiente</Link>
      </>}
    </nav>
    <section className="panel-card">
      {vista === 'semana'
        ? <>
          {!citas.length && <p className="muted-text">No hay citas para esta semana. Los espacios disponibles se muestran en blanco.</p>}
          <div className="table-scroll"><table className="week-calendar">
            <thead><tr><th>Hora</th>{diasSemana.map((dia) => <th key={dia}>{etiquetaDia(dia)}</th>)}</tr></thead>
            <tbody>{HORAS_SEMANA.map((hora) => <tr key={hora}>
              <th>{hora}</th>
              {diasSemana.map((dia) => {
                const cita = citaPorCelda.get(`${dia} ${hora}`);
                return <td key={dia} className={cita ? 'week-calendar-booked' : undefined}>
                  {cita && <Link href={`/contador/clientes/${cita.clienteId}`}>
                    <strong>{cita.nombre}</strong><span>Pago: {cita.estadoPago}</span>
                  </Link>}
                </td>;
              })}
            </tr>)}</tbody>
          </table></div>
        </>
        : citas.length
          ? <div className="table-scroll"><table><thead><tr><th>Hora</th><th>Cliente</th><th>Estado de cita</th><th>Estado de pago</th><th>Acciones</th></tr></thead>
            <tbody>{citas.map((cita) => <tr key={cita.id}><td>{cita.hora}–{cita.horaFin}</td><td><Link href={`/contador/clientes/${cita.clienteId}`}>{cita.nombre}</Link></td>
              <td>{cita.estadoCita}</td><td>{cita.estadoPago}</td><td><Link className="text-link" href={`/contador/clientes/${cita.clienteId}`}>Ver cliente y gestionar</Link></td></tr>)}</tbody></table></div>
          : <div className="empty-state"><h3>No hay citas para esta fecha</h3><p>Seleccione otro día o agende una cita desde el detalle del cliente.</p></div>}
    </section>
  </div>;
}
