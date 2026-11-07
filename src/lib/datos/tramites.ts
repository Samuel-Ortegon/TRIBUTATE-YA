import { consultar, conTransaccion } from '@/lib/db/conexion';
import { ahoraBogota } from '@/lib/reglas/fechas';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { puedeIniciarTramite, siguienteEstado, type ResultadoRevision } from '@/lib/reglas/estados';
import { validarCorreccionRevision, validarRegistroRevision } from '@/lib/reglas/revisiones';
import { actualizarEstadoCliente, bloquearCliente, registrarEvento } from '@/lib/datos/eventos';

export async function registrarRevision(datos: {
  citaId: number; resultado: ResultadoRevision; observaciones?: string;
}): Promise<{ revisionId: number }> {
  return conTransaccion(async (tx) => {
    const referencia = await tx.query<{ cliente_id: string }>('SELECT cliente_id FROM citas WHERE id = $1', [datos.citaId]);
    const clienteId = referencia.rows[0]?.cliente_id;
    if (!clienteId) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
    const cliente = await bloquearCliente(tx, clienteId);
    const resultado = await tx.query<{ estado_cita: string; estado_pago: string }>(
      'SELECT estado_cita, estado_pago FROM citas WHERE id = $1 FOR UPDATE', [datos.citaId],
    );
    const cita = resultado.rows[0];
    if (!cita) throw new ErrorDeNegocio('CITA_NO_ENCONTRADA');
    const revisiones = await tx.query<{ existe: boolean; pago_confirmado: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM revisiones WHERE cliente_id = $1) AS existe,
              EXISTS (SELECT 1 FROM pagos WHERE cita_id = $2 AND estado = 'confirmado') AS pago_confirmado`,
      [cliente.id, datos.citaId],
    );
    const revisionPrev = revisiones.rows[0];
    if (!revisionPrev) throw new ErrorDeNegocio('ERROR_INTERNO');
    validarRegistroRevision({
      estadoCliente: cliente.estado,
      citaPagada: cita.estado_pago === 'pagada' && revisionPrev.pago_confirmado,
      existeRevision: revisionPrev.existe,
    });
    const insertada = await tx.query<{ id: number }>(
      `INSERT INTO revisiones (cliente_id, cita_id, resultado, observaciones, fecha_revision)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [cliente.id, datos.citaId, datos.resultado, datos.observaciones ?? null, ahoraBogota().fecha],
    );
    const nuevaRevision = insertada.rows[0];
    if (!nuevaRevision) throw new ErrorDeNegocio('ERROR_INTERNO');
    const eventoEstado = datos.resultado === 'debe_declarar' ? 'REVISION_DEBE_DECLARAR' : 'REVISION_NO_DEBE_DECLARAR';
    const estadoNuevo = siguienteEstado(cliente.estado, eventoEstado);
    await actualizarEstadoCliente(tx, cliente.id, estadoNuevo);
    await tx.query(`UPDATE citas SET estado_cita = 'atendida' WHERE id = $1`, [datos.citaId]);
    await registrarEvento(tx, {
      clienteId: cliente.id, tipo: 'REVISION_REGISTRADA', anterior: cliente.estado, nuevo: estadoNuevo,
      actor: 'contador', detalle: { revisionId: Number(nuevaRevision.id), citaId: datos.citaId },
    });
    return { revisionId: Number(nuevaRevision.id) };
  });
}

export async function corregirRevision(
  revisionId: number,
  resultadoNuevo: ResultadoRevision,
  motivo: string,
): Promise<void> {
  await conTransaccion(async (tx) => {
    const referencia = await tx.query<{ cliente_id: string }>(
      'SELECT cliente_id FROM revisiones WHERE id = $1', [revisionId],
    );
    const clienteId = referencia.rows[0]?.cliente_id;
    if (!clienteId) throw new ErrorDeNegocio('REVISION_NO_ENCONTRADA');
    const cliente = await bloquearCliente(tx, clienteId);
    const resultado = await tx.query<{ resultado: ResultadoRevision }>(
      'SELECT resultado FROM revisiones WHERE id = $1 FOR UPDATE', [revisionId],
    );
    const revision = resultado.rows[0];
    if (!revision) throw new ErrorDeNegocio('REVISION_NO_ENCONTRADA');
    const pagos = await tx.query<{ cantidad: number }>(
      `SELECT count(*)::int AS cantidad FROM pagos
       WHERE cliente_id = $1 AND tipo = 'servicio_completo' AND estado <> 'anulado'`,
      [cliente.id],
    );
    const evento = validarCorreccionRevision({
      estadoCliente: cliente.estado, resultadoActual: revision.resultado,
      resultadoNuevo, pagosServicioNoAnulados: pagos.rows[0]?.cantidad ?? 0, motivo,
    });
    const estadoNuevo = siguienteEstado(cliente.estado, evento);
    await tx.query(
      `UPDATE revisiones SET resultado = $2, observaciones = $3 WHERE id = $1`,
      [revisionId, resultadoNuevo, motivo.trim()],
    );
    await actualizarEstadoCliente(tx, cliente.id, estadoNuevo);
    await registrarEvento(tx, {
      clienteId: cliente.id, tipo: 'REVISION_CORREGIDA', anterior: cliente.estado,
      nuevo: estadoNuevo, actor: 'contador',
      detalle: { revisionId, resultadoAnterior: revision.resultado, resultadoNuevo, motivo: motivo.trim(), eventoEstado: evento },
    });
  });
}

export async function iniciarTramite(clienteId: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const cliente = await bloquearCliente(tx, clienteId);
    const resultado = await tx.query<{ resultado: ResultadoRevision | null; pago_confirmado: boolean }>(
      `SELECT r.resultado,
        EXISTS (SELECT 1 FROM pagos p WHERE p.cliente_id = c.id
          AND p.tipo = 'servicio_completo' AND p.estado = 'confirmado') AS pago_confirmado
       FROM clientes c LEFT JOIN revisiones r ON r.cliente_id = c.id WHERE c.id = $1`,
      [clienteId],
    );
    const datos = resultado.rows[0];
    if (!datos || !puedeIniciarTramite({
      estado: cliente.estado, resultadoRevision: datos.resultado,
      tienePagoServicioConfirmado: datos.pago_confirmado,
    })) {
      throw new ErrorDeNegocio('TRAMITE_NO_HABILITADO');
    }
    const estadoNuevo = siguienteEstado(cliente.estado, 'INICIAR_TRAMITE');
    await actualizarEstadoCliente(tx, clienteId, estadoNuevo);
    await registrarEvento(tx, {
      clienteId, tipo: 'TRAMITE_INICIADO', anterior: cliente.estado, nuevo: estadoNuevo,
      actor: 'contador',
    });
  });
}
