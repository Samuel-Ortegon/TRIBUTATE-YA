import { consultar, conTransaccion } from '@/lib/db/conexion';
import { validarNuevoRango, type RangoCalendario } from '@/lib/reglas/calendario';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { FilaCalendario } from '@/lib/datos/tipos';

type RangoFila = {
  id: number; anio_gravable: number; digito_desde: number; digito_hasta: number;
  fecha_limite: string; es_demo: boolean;
};
const mapear = (r: RangoFila): FilaCalendario => ({
  id: Number(r.id), anioGravable: Number(r.anio_gravable), digitoDesde: Number(r.digito_desde),
  digitoHasta: Number(r.digito_hasta), fechaLimite: r.fecha_limite, esDemo: r.es_demo,
});
async function obtenerRangosCalendario(): Promise<RangoCalendario[]> {
  const filas = await consultar<Omit<RangoFila, 'id' | 'es_demo'>>(
    'SELECT anio_gravable, digito_desde, digito_hasta, to_char(fecha_limite, \'YYYY-MM-DD\') AS fecha_limite FROM calendario_renta',
  );
  return filas.map((r) => ({
    anioGravable: Number(r.anio_gravable), digitoDesde: Number(r.digito_desde),
    digitoHasta: Number(r.digito_hasta), fechaLimite: r.fecha_limite,
  }));
}
export async function listarCalendario(): Promise<FilaCalendario[]> {
  return (await consultar<RangoFila>(
    `SELECT id, anio_gravable, digito_desde, digito_hasta,
            to_char(fecha_limite, 'YYYY-MM-DD') AS fecha_limite, es_demo
     FROM calendario_renta ORDER BY anio_gravable DESC, digito_desde ASC`,
  )).map(mapear);
}
export async function agregarRangoCalendario(rango: RangoCalendario): Promise<{ id: number }> {
  return conTransaccion(async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock($1)', [rango.anioGravable]);
    const resultado = await tx.query<RangoFila>(
      `SELECT anio_gravable, digito_desde, digito_hasta,
              to_char(fecha_limite, 'YYYY-MM-DD') AS fecha_limite
       FROM calendario_renta WHERE anio_gravable = $1 FOR UPDATE`, [rango.anioGravable],
    );
    validarNuevoRango(rango, resultado.rows.map((r) => ({
      anioGravable: Number(r.anio_gravable), digitoDesde: Number(r.digito_desde),
      digitoHasta: Number(r.digito_hasta), fechaLimite: r.fecha_limite,
    })));
    const insertado = await tx.query<{ id: number }>(
      `INSERT INTO calendario_renta (anio_gravable, digito_desde, digito_hasta, fecha_limite)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [rango.anioGravable, rango.digitoDesde, rango.digitoHasta, rango.fechaLimite],
    );
    const filaInsertada = insertado.rows[0];
    if (!filaInsertada) throw new ErrorDeNegocio('ERROR_INTERNO');
    return { id: Number(filaInsertada.id) };
  });
}
export async function eliminarRangoCalendario(id: number): Promise<void> {
  const resultado = await consultar<{ id: number }>('DELETE FROM calendario_renta WHERE id = $1 RETURNING id', [id]);
  if (!resultado.length) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El rango de calendario no existe.');
}
export async function eliminarCalendarioDemo(): Promise<{ eliminados: number }> {
  const resultado = await consultar<{ id: number }>('DELETE FROM calendario_renta WHERE es_demo = true RETURNING id');
  return { eliminados: resultado.length };
}
export { obtenerRangosCalendario };
