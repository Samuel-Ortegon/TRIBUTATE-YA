-- M2: fecha límite efectiva y cierre de acceso público

CREATE OR REPLACE VIEW v_clientes_fecha
WITH (security_invoker = true) AS
SELECT
  c.*,
  cal.fecha_limite AS fecha_limite_calendario,
  COALESCE(c.fecha_limite_renta, cal.fecha_limite) AS fecha_limite_efectiva,
  CASE
    WHEN c.fecha_limite_renta IS NOT NULL THEN 'manual'
    WHEN cal.fecha_limite IS NOT NULL THEN 'calendario'
    ELSE 'sin_informacion'
  END AS origen_fecha_limite
FROM clientes c
LEFT JOIN calendario_renta cal
  ON cal.anio_gravable = (SELECT MAX(anio_gravable) FROM calendario_renta)
 AND CAST(RIGHT(c.cc, 2) AS SMALLINT) BETWEEN cal.digito_desde AND cal.digito_hasta;

ALTER TABLE calendario_renta ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_cliente  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON calendario_renta, clientes, citas, pagos, revisiones, eventos_cliente
  FROM anon, authenticated;
REVOKE ALL ON v_clientes_fecha FROM anon, authenticated;
