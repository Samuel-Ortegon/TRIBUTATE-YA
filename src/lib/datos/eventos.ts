import type { PoolClient } from 'pg';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import type { EstadoTramite } from '@/lib/reglas/estados';

export async function registrarEvento(
  tx: PoolClient,
  evento: {
    clienteId: string; tipo: string; anterior?: string | null; nuevo?: string | null;
    actor: 'cliente' | 'contador' | 'sistema'; detalle?: Record<string, unknown>;
  },
): Promise<void> {
  await tx.query(
    `INSERT INTO eventos_cliente (cliente_id, tipo, estado_anterior, estado_nuevo, actor, detalle)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [evento.clienteId, evento.tipo, evento.anterior ?? null, evento.nuevo ?? null, evento.actor,
      JSON.stringify(evento.detalle ?? {})],
  );
}

export async function bloquearCliente(
  tx: PoolClient,
  clienteId: string,
): Promise<{ id: string; cc: string; estado: EstadoTramite }> {
  const resultado = await tx.query<{ id: string; cc: string; estado: EstadoTramite }>(
    'SELECT id, cc, estado FROM clientes WHERE id = $1 FOR UPDATE', [clienteId],
  );
  const cliente = resultado.rows[0];
  if (!cliente) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');
  return cliente;
}

export async function actualizarEstadoCliente(
  tx: PoolClient,
  clienteId: string,
  estado: EstadoTramite,
): Promise<void> {
  await tx.query('UPDATE clientes SET estado = $2 WHERE id = $1', [clienteId, estado]);
}
