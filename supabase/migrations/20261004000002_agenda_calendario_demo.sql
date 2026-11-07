-- M3: calendario de DEMOSTRACIÓN. Se reemplaza desde el panel con el calendario oficial vigente.
-- Fechas relativas al día en que se aplica, para probar los tres estados de la Regla 7.

WITH hoy AS (SELECT (NOW() AT TIME ZONE 'America/Bogota')::date AS d)
INSERT INTO calendario_renta (anio_gravable, digito_desde, digito_hasta, fecha_limite, es_demo)
SELECT (EXTRACT(YEAR FROM hoy.d)::int - 1)::smallint, r.desde, r.hasta, hoy.d + r.dias, true
FROM hoy,
     (VALUES (0, 19, -10), (20, 39, 0), (40, 59, 10), (60, 79, 30), (80, 99, 60))
       AS r(desde, hasta, dias)
WHERE NOT EXISTS (SELECT 1 FROM calendario_renta);
