import type { EventoCliente } from '@/lib/datos/tipos';
import { describirEvento, etiquetaEstadoTramite, formatearFechaHora } from '@/lib/formato';

const ETIQUETA_ACTOR: Record<EventoCliente['actor'], string> = {
  cliente: 'Cliente',
  contador: 'Contador',
  sistema: 'Sistema',
};

export function LineaDeTiempo({ eventos }: { eventos: EventoCliente[] }) {
  if (!eventos.length) return <p className="muted-text">Sin eventos registrados.</p>;
  return (
    <ol className="timeline">
      {eventos.map((evento) => (
        <li className="timeline-item" key={evento.id}>
          <time className="muted-text">{formatearFechaHora(evento.creadoEn)}</time>
          <p>{describirEvento(evento)}</p>
          {evento.estadoAnterior && evento.estadoNuevo && (
            <p className="muted-text">
              Estado: {etiquetaEstadoTramite(evento.estadoAnterior)} → {etiquetaEstadoTramite(evento.estadoNuevo)}
            </p>
          )}
          <p className="muted-text">Actor: {ETIQUETA_ACTOR[evento.actor]}</p>
        </li>
      ))}
    </ol>
  );
}
