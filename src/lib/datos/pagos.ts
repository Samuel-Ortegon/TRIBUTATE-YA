import { consultar, conTransaccion } from '@/lib/db/conexion';
import type { PoolClient } from 'pg';
import { evaluarMonto, validarRegistroPago, validarResolucionPago, valorEsperado, type EstadoPago, type TipoPago } from '@/lib/reglas/pagos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { siguienteEstado, type EstadoTramite } from '@/lib/reglas/estados';
import type { DatosPago, FilaPago } from '@/lib/datos/tipos';
import { actualizarEstadoCliente, bloquearCliente, registrarEvento } from '@/lib/datos/eventos';

async function aplicarConfirmacion(
  tx: PoolClient,
  datos: { id: number; clienteId: string; tipo: TipoPago; citaId: number | null; estadoCliente: EstadoTramite },
): Promise<void> {
  const evento = datos.tipo === 'primera_consulta' ? 'CONFIRMAR_PAGO_CONSULTA' : 'CONFIRMAR_PAGO_SERVICIO';
  const nuevo = siguienteEstado(datos.estadoCliente, evento);
  if (datos.citaId !== null) {
    await tx.query(`UPDATE citas SET estado_pago = 'pagada' WHERE id = $1`, [datos.citaId]);
  }
  await actualizarEstadoCliente(tx, datos.clienteId, nuevo);
  await registrarEvento(tx, {
    clienteId: datos.clienteId, tipo: evento, anterior: datos.estadoCliente, nuevo,
    actor: 'sistema', detalle: { pagoId: datos.id, tipo: datos.tipo },
  });
}

export async function registrarPago(datos: DatosPago): Promise<{ pagoId: number; estado: EstadoPago }> {
  return conTransaccion(async (tx) => {
    const cliente = await bloquearCliente(tx, datos.clienteId);
    let cita: { estado_cita: 'agendada' | 'atendida' | 'cancelada'; estado_pago: 'pendiente' | 'pagada' } | null = null;
    if (datos.citaId !== undefined) {
      const resultado = await tx.query<{
        estado_cita: 'agendada' | 'atendida' | 'cancelada';
        estado_pago: 'pendiente' | 'pagada';
      }>(
        `SELECT estado_cita, estado_pago FROM citas WHERE id = $1 AND cliente_id = $2 FOR UPDATE`,
        [datos.citaId, datos.clienteId],
      );
      cita = resultado.rows[0] ?? null;
      if (!cita) throw new ErrorDeNegocio('DATOS_INVALIDOS');
    }
    const confirmados = await tx.query<{ existe: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM pagos
       WHERE cliente_id = $1 AND estado = 'confirmado'
         AND (($2 = 'primera_consulta' AND tipo = $2 AND cita_id = $3)
           OR ($2 = 'servicio_completo' AND tipo = $2))) AS existe`,
      [datos.clienteId, datos.tipo, datos.citaId ?? null],
    );
    const pagoExistente = confirmados.rows[0];
    if (!pagoExistente) throw new ErrorDeNegocio('ERROR_INTERNO');
    validarRegistroPago({
      tipo: datos.tipo,
      estadoCliente: cliente.estado,
      cita: cita ? { estadoCita: cita.estado_cita, estadoPago: cita.estado_pago } : null,
      existeConfirmado: pagoExistente.existe,
    });
    const esperado = valorEsperado(datos.tipo);
    const estado = evaluarMonto(datos.monto, esperado);
    const insertado = await tx.query<{ id: number }>(
      `INSERT INTO pagos (cliente_id, cita_id, tipo, monto, valor_esperado, metodo, referencia, estado, fecha_pago)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [datos.clienteId, datos.citaId ?? null, datos.tipo, datos.monto, esperado,
        datos.metodo, datos.referencia ?? null, estado, datos.fechaPago],
    );
    const nuevoPago = insertado.rows[0];
    if (!nuevoPago) throw new ErrorDeNegocio('ERROR_INTERNO');
    const pagoId = Number(nuevoPago.id);
    await registrarEvento(tx, {
      clienteId: datos.clienteId, tipo: 'PAGO_REGISTRADO', actor: 'contador',
      detalle: { pagoId, tipo: datos.tipo, monto: datos.monto, estado },
    });
    if (estado === 'confirmado') {
      await aplicarConfirmacion(tx, {
        id: pagoId, clienteId: datos.clienteId, tipo: datos.tipo,
        citaId: datos.citaId ?? null, estadoCliente: cliente.estado,
      });
    }
    return { pagoId, estado };
  });
}

async function resolverPago(pagoId: number, decision: 'aprobar' | 'anular', observacion: string): Promise<void> {
  await conTransaccion(async (tx) => {
    const referencia = await tx.query<{ cliente_id: string }>('SELECT cliente_id FROM pagos WHERE id = $1', [pagoId]);
    const clienteId = referencia.rows[0]?.cliente_id;
    if (!clienteId) throw new ErrorDeNegocio('PAGO_NO_ENCONTRADO');
    const cliente = await bloquearCliente(tx, clienteId);
    const resultado = await tx.query<{
      id: number; cliente_id: string; cita_id: number | null; tipo: TipoPago; estado: EstadoPago;
    }>('SELECT id, cliente_id, cita_id, tipo, estado FROM pagos WHERE id = $1 FOR UPDATE', [pagoId]);
    const pago = resultado.rows[0];
    if (!pago) throw new ErrorDeNegocio('PAGO_NO_ENCONTRADO');
    validarResolucionPago({ estadoPago: pago.estado, decision, observacion });
    const siguiente: EstadoPago = decision === 'aprobar' ? 'confirmado' : 'anulado';
    await tx.query(
      'UPDATE pagos SET estado = $2, observacion = $3 WHERE id = $1', [pagoId, siguiente, observacion.trim()],
    );
    await registrarEvento(tx, {
      clienteId: pago.cliente_id, tipo: decision === 'aprobar' ? 'PAGO_APROBADO' : 'PAGO_ANULADO',
      actor: 'contador', detalle: { pagoId, observacion: observacion.trim() },
    });
    if (decision === 'aprobar') {
      await aplicarConfirmacion(tx, {
        id: pagoId, clienteId: pago.cliente_id, tipo: pago.tipo,
        citaId: pago.cita_id === null ? null : Number(pago.cita_id), estadoCliente: cliente.estado,
      });
    }
  });
}

export async function aprobarPago(pagoId: number, observacion: string): Promise<void> {
  await resolverPago(pagoId, 'aprobar', observacion);
}
export async function anularPago(pagoId: number, observacion: string): Promise<void> {
  await resolverPago(pagoId, 'anular', observacion);
}
export async function listarPagosEnRevision(): Promise<FilaPago[]> {
  const pagos = await consultar<{
    id: number; cliente_id: string; nombre: string; tipo: TipoPago; monto: number;
    valor_esperado: number; metodo: string; fecha_pago: string;
  }>(
    `SELECT p.id, p.cliente_id, c.nombre, p.tipo, p.monto, p.valor_esperado,
            p.metodo, to_char(p.fecha_pago, 'YYYY-MM-DD') AS fecha_pago
     FROM pagos p JOIN clientes c ON c.id = p.cliente_id
     WHERE p.estado = 'requiere_revision' ORDER BY p.fecha_pago, p.id`,
  );
  return pagos.map((p) => ({
    id: Number(p.id), clienteId: p.cliente_id, nombre: p.nombre, tipo: p.tipo,
    monto: Number(p.monto), valorEsperado: Number(p.valor_esperado),
    diferencia: Number(p.monto) - Number(p.valor_esperado),
    metodo: p.metodo, fechaPago: p.fecha_pago,
  }));
}
