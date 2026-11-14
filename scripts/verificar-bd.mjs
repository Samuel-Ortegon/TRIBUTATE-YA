import { createDatabaseClient } from './db-client.mjs';
const connectionString =
  process.env.TRIBUTATE_YA_POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.TRIBUTATE_YA_POSTGRES_URL;

if (!connectionString) {
  console.error('Falta DATABASE_URL o TRIBUTATE_YA_POSTGRES_URL en el entorno.');
  process.exit(1);
}

const client = createDatabaseClient(connectionString);

function printLine(label, value) {
  console.log(`${label}: ${value}`);
}

async function ejecutarConsulta(sql, params = []) {
  const resultado = await client.query(sql, params);
  return resultado.rows;
}

async function principal() {
  await client.connect();

  printLine('Verificando base de datos', connectionString.replace(/:[^@]+@/, ':***@'));

  const tablas = ['calendario_renta', 'clientes', 'citas', 'pagos', 'revisiones', 'eventos_cliente', 'notas_cliente'];
  for (const tabla of tablas) {
    const rows = await ejecutarConsulta(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1
       ) AS existe;`,
      [tabla],
    );
    printLine(`Existencia ${tabla}`, rows[0]?.existe ? 'sí' : 'no');
  }

  const vista = await ejecutarConsulta(
    `SELECT EXISTS (
       SELECT FROM information_schema.views
       WHERE table_schema = 'public' AND table_name = 'v_clientes_fecha'
     ) AS existe;`,
  );
  printLine('Existencia v_clientes_fecha', vista[0]?.existe ? 'sí' : 'no');

  for (const tabla of tablas) {
    const rows = await ejecutarConsulta(`SELECT COUNT(*)::int AS total FROM public.${tabla};`);
    printLine(`Filas ${tabla}`, rows[0]?.total ?? 0);
  }

  const restricciones = await ejecutarConsulta(`
    SELECT conname AS nombre, conrelid::regclass::text AS tabla
    FROM pg_constraint
    WHERE conname IN ('citas_sin_cruce', 'ux_citas_una_activa_por_cliente', 'ux_pagos_consulta_confirmado', 'ux_pagos_servicio_confirmado');
  `);
  printLine('Restricciones/índices', JSON.stringify(restricciones));

  const indices = await ejecutarConsulta(`
    SELECT indexname, tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN ('citas_sin_cruce', 'ux_citas_una_activa_por_cliente', 'ux_pagos_consulta_confirmado', 'ux_pagos_servicio_confirmado');
  `);
  printLine('Índices parciales', JSON.stringify(indices));

  const rls = await ejecutarConsulta(`
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname IN ('calendario_renta', 'clientes', 'citas', 'pagos', 'revisiones', 'eventos_cliente', 'notas_cliente');
  `);
  printLine('RLS', JSON.stringify(rls));

  const demoRows = await ejecutarConsulta(`
    SELECT *
    FROM public.calendario_renta
    WHERE es_demo = true
    ORDER BY anio_gravable, digito_desde;`);
  printLine('Calendario demo', JSON.stringify(demoRows));

  let segundaFalla = false;
  let regla8Ok = false;

  await ejecutarConsulta('BEGIN');

  try {
    await ejecutarConsulta(`
      INSERT INTO public.clientes (cc, nombre, telefono, correo, acepta_tratamiento_datos, origen_registro, estado)
      VALUES
        ('9999999991', 'Cliente Uno', '3001234567', 'uno@test.com', true, 'contador', 'registrado'),
        ('9999999992', 'Cliente Dos', '3001234568', 'dos@test.com', true, 'contador', 'registrado'),
        ('9999999993', 'Cliente Tres', '3001234569', 'tres@test.com', true, 'contador', 'registrado');
    `);

    const cliente1 = await ejecutarConsulta(`SELECT id FROM public.clientes WHERE cc = '9999999991' LIMIT 1;`);
    const cliente2 = await ejecutarConsulta(`SELECT id FROM public.clientes WHERE cc = '9999999992' LIMIT 1;`);
    const cliente3 = await ejecutarConsulta(`SELECT id FROM public.clientes WHERE cc = '9999999993' LIMIT 1;`);

    await ejecutarConsulta(
      `INSERT INTO public.citas (cliente_id, inicio, valor, estado_pago, estado_cita, origen)
       VALUES ($1, '2030-01-07 10:00', 150000, 'pendiente', 'agendada', 'contador');`,
      [cliente1[0].id],
    );

    await ejecutarConsulta('SAVEPOINT regla2_cruce');
    try {
      await ejecutarConsulta(
        `INSERT INTO public.citas (cliente_id, inicio, valor, estado_pago, estado_cita, origen)
         VALUES ($1, '2030-01-07 10:15', 150000, 'pendiente', 'agendada', 'contador');`,
        [cliente2[0].id],
      );
      segundaFalla = false;
    } catch (error) {
      segundaFalla = true;
      await ejecutarConsulta('ROLLBACK TO SAVEPOINT regla2_cruce');
      if (error?.code !== '23P01') {
        throw error;
      }
    }

    if (!segundaFalla) {
      throw new Error('FALLA: la cita a las 10:15 no fue rechazada.');
    }
    printLine('Regla 2 · cruce a las 10:15 rechazado', 'OK');

    await ejecutarConsulta(
      `INSERT INTO public.citas (cliente_id, inicio, valor, estado_pago, estado_cita, origen)
       VALUES ($1, '2030-01-07 10:30', 150000, 'pendiente', 'agendada', 'contador');`,
      [cliente3[0].id],
    );
    printLine('Regla 2 · cita a las 10:30 permitida', 'OK');

    await ejecutarConsulta('SAVEPOINT regla8_duplicada');
    try {
      await ejecutarConsulta(
        `INSERT INTO public.citas (cliente_id, inicio, valor, estado_pago, estado_cita, origen)
         VALUES ($1, '2030-01-07 15:00', 150000, 'pendiente', 'agendada', 'contador');`,
        [cliente3[0].id],
      );
      regla8Ok = false;
    } catch (error) {
      regla8Ok = true;
      await ejecutarConsulta('ROLLBACK TO SAVEPOINT regla8_duplicada');
      if (error?.code !== '23505') {
        throw error;
      }
    }

    if (!regla8Ok) {
      throw new Error('FALLA: la segunda cita activa del mismo cliente no fue rechazada.');
    }
    printLine('Regla 8 · segunda cita activa rechazada', 'OK');

    await ejecutarConsulta('ROLLBACK');
  } catch (error) {
    await ejecutarConsulta('ROLLBACK');
    console.error('FALLA');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

try {
  await principal();
} finally {
  await client.end();
}
