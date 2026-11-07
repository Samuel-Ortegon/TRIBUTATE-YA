-- M1: tablas del módulo Agenda Tributaria

CREATE TABLE IF NOT EXISTS calendario_renta (
  id             BIGSERIAL    PRIMARY KEY,
  anio_gravable  SMALLINT     NOT NULL,
  digito_desde   SMALLINT     NOT NULL,
  digito_hasta   SMALLINT     NOT NULL,
  fecha_limite   DATE         NOT NULL,
  es_demo        BOOLEAN      NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT calendario_anio_valido   CHECK (anio_gravable BETWEEN 2020 AND 2100),
  CONSTRAINT calendario_digitos_rango CHECK (digito_desde BETWEEN 0 AND 99 AND digito_hasta BETWEEN 0 AND 99),
  CONSTRAINT calendario_rango_valido  CHECK (digito_desde <= digito_hasta)
);
CREATE INDEX IF NOT EXISTS idx_calendario_anio ON calendario_renta (anio_gravable);

CREATE TABLE IF NOT EXISTS clientes (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  cc                        VARCHAR(10)   NOT NULL,
  nombre                    VARCHAR(120)  NOT NULL,
  telefono                  VARCHAR(10)   NOT NULL,
  correo                    VARCHAR(160)  NOT NULL,
  fecha_limite_renta        DATE,
  estado                    VARCHAR(20)   NOT NULL DEFAULT 'registrado',
  acepta_tratamiento_datos  BOOLEAN       NOT NULL,
  autorizacion_datos_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  origen_registro           VARCHAR(10)   NOT NULL,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT clientes_cc_unica          UNIQUE (cc),
  CONSTRAINT clientes_cc_formato        CHECK (cc ~ '^[0-9]{6,10}$'),
  CONSTRAINT clientes_nombre_minimo     CHECK (char_length(btrim(nombre)) >= 3),
  CONSTRAINT clientes_telefono_formato  CHECK (telefono ~ '^(3[0-9]{9}|60[0-9]{8})$'),
  CONSTRAINT clientes_correo_formato    CHECK (correo ~* '^[^@ ]+@[^@ ]+\.[^@ ]+$'),
  CONSTRAINT clientes_autorizacion      CHECK (acepta_tratamiento_datos = true),
  CONSTRAINT clientes_origen_valido     CHECK (origen_registro IN ('cliente', 'contador')),
  CONSTRAINT clientes_estado_valido     CHECK (estado IN (
    'registrado', 'cita_agendada', 'consulta_pagada',
    'debe_declarar', 'no_debe_declarar', 'servicio_pagado', 'en_proceso'))
);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes (estado);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (lower(nombre));

CREATE TABLE IF NOT EXISTS citas (
  id                  BIGSERIAL    PRIMARY KEY,
  cliente_id          UUID         NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  inicio              TIMESTAMP    NOT NULL,
  fin                 TIMESTAMP    GENERATED ALWAYS AS (inicio + INTERVAL '30 minutes') STORED,
  duracion_minutos    SMALLINT     NOT NULL DEFAULT 30,
  valor               INTEGER      NOT NULL,
  estado_pago         VARCHAR(10)  NOT NULL DEFAULT 'pendiente',
  estado_cita         VARCHAR(10)  NOT NULL DEFAULT 'agendada',
  origen              VARCHAR(10)  NOT NULL,
  motivo_cancelacion  TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT citas_duracion            CHECK (duracion_minutos = 30),
  CONSTRAINT citas_valor_positivo      CHECK (valor > 0),
  CONSTRAINT citas_estado_pago_valido  CHECK (estado_pago IN ('pendiente', 'pagada')),
  CONSTRAINT citas_estado_valido       CHECK (estado_cita IN ('agendada', 'atendida', 'cancelada')),
  CONSTRAINT citas_origen_valido       CHECK (origen IN ('cliente', 'contador')),
  CONSTRAINT citas_sin_cruce EXCLUDE USING gist (
    tsrange(inicio, inicio + INTERVAL '30 minutes', '[)') WITH &&
  ) WHERE (estado_cita <> 'cancelada')
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_citas_una_activa_por_cliente
  ON citas (cliente_id) WHERE estado_cita = 'agendada';
CREATE INDEX IF NOT EXISTS idx_citas_inicio ON citas (inicio);

CREATE TABLE IF NOT EXISTS pagos (
  id              BIGSERIAL    PRIMARY KEY,
  cliente_id      UUID         NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  cita_id         BIGINT       REFERENCES citas(id) ON DELETE RESTRICT,
  tipo            VARCHAR(20)  NOT NULL,
  monto           INTEGER      NOT NULL,
  valor_esperado  INTEGER      NOT NULL,
  metodo          VARCHAR(15)  NOT NULL,
  referencia      VARCHAR(80),
  estado          VARCHAR(20)  NOT NULL,
  fecha_pago      DATE         NOT NULL,
  observacion     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT pagos_tipo_valido    CHECK (tipo IN ('primera_consulta', 'servicio_completo')),
  CONSTRAINT pagos_monto_positivo CHECK (monto > 0),
  CONSTRAINT pagos_metodo_valido  CHECK (metodo IN ('efectivo', 'transferencia', 'nequi', 'daviplata', 'otro')),
  CONSTRAINT pagos_estado_valido  CHECK (estado IN ('pendiente', 'confirmado', 'requiere_revision', 'anulado')),
  CONSTRAINT pagos_cita_segun_tipo CHECK (
    (tipo = 'primera_consulta' AND cita_id IS NOT NULL) OR
    (tipo = 'servicio_completo' AND cita_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_consulta_confirmado
  ON pagos (cita_id) WHERE tipo = 'primera_consulta' AND estado = 'confirmado';
CREATE UNIQUE INDEX IF NOT EXISTS ux_pagos_servicio_confirmado
  ON pagos (cliente_id) WHERE tipo = 'servicio_completo' AND estado = 'confirmado';
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos (estado);

CREATE TABLE IF NOT EXISTS revisiones (
  id              BIGSERIAL    PRIMARY KEY,
  cliente_id      UUID         NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  cita_id         BIGINT       NOT NULL REFERENCES citas(id) ON DELETE RESTRICT,
  resultado       VARCHAR(20)  NOT NULL,
  observaciones   TEXT,
  fecha_revision  DATE         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT revisiones_resultado_valido CHECK (resultado IN ('debe_declarar', 'no_debe_declarar')),
  CONSTRAINT revisiones_una_por_cita     UNIQUE (cita_id),
  CONSTRAINT revisiones_una_por_cliente  UNIQUE (cliente_id)
);

CREATE TABLE IF NOT EXISTS eventos_cliente (
  id               BIGSERIAL    PRIMARY KEY,
  cliente_id       UUID         NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo             VARCHAR(40)  NOT NULL,
  estado_anterior  VARCHAR(20),
  estado_nuevo     VARCHAR(20),
  detalle          JSONB        NOT NULL DEFAULT '{}'::jsonb,
  actor            VARCHAR(10)  NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT eventos_actor_valido CHECK (actor IN ('cliente', 'contador', 'sistema'))
);
CREATE INDEX IF NOT EXISTS idx_eventos_cliente ON eventos_cliente (cliente_id, created_at DESC);

CREATE OR REPLACE FUNCTION agenda_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION agenda_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_citas_updated_at ON citas;
CREATE TRIGGER trg_citas_updated_at BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION agenda_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_pagos_updated_at ON pagos;
CREATE TRIGGER trg_pagos_updated_at BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION agenda_actualizar_updated_at();
DROP TRIGGER IF EXISTS trg_revisiones_updated_at ON revisiones;
CREATE TRIGGER trg_revisiones_updated_at BEFORE UPDATE ON revisiones
  FOR EACH ROW EXECUTE FUNCTION agenda_actualizar_updated_at();
