CREATE TABLE IF NOT EXISTS notas_cliente (
  id BIGSERIAL PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  texto TEXT NOT NULL CHECK (char_length(btrim(texto)) BETWEEN 3 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_cliente
  ON notas_cliente (cliente_id, created_at DESC);

ALTER TABLE notas_cliente ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON notas_cliente FROM anon, authenticated;
