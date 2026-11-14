import { consultar, conTransaccion } from '@/lib/db/conexion';
import { registrarEvento } from '@/lib/datos/eventos';
import type { NotaCliente } from '@/lib/datos/tipos';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export async function listarNotas(clienteId: string): Promise<NotaCliente[]> {
  const filas = await consultar<{ id: number; texto: string; creado_en: string }>(
    `SELECT id, texto,
            to_char(created_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD HH24:MI') AS creado_en
     FROM notas_cliente WHERE cliente_id = $1 ORDER BY created_at DESC, id DESC`,
    [clienteId],
  );
  return filas.map((fila) => ({
    id: Number(fila.id),
    texto: fila.texto,
    creadoEn: fila.creado_en,
  }));
}

export async function agregarNota(clienteId: string, texto: string): Promise<{ id: number }> {
  return conTransaccion(async (tx) => {
    const cliente = await tx.query<{ id: string }>('SELECT id FROM clientes WHERE id = $1 FOR UPDATE', [clienteId]);
    if (!cliente.rows[0]) throw new ErrorDeNegocio('CLIENTE_NO_ENCONTRADO');

    const insertada = await tx.query<{ id: number }>(
      'INSERT INTO notas_cliente (cliente_id, texto) VALUES ($1, $2) RETURNING id',
      [clienteId, texto.trim()],
    );
    const nota = insertada.rows[0];
    if (!nota) throw new ErrorDeNegocio('ERROR_INTERNO');

    await registrarEvento(tx, {
      clienteId,
      tipo: 'NOTA_AGREGADA',
      actor: 'contador',
      detalle: { notaId: Number(nota.id) },
    });
    return { id: Number(nota.id) };
  });
}
