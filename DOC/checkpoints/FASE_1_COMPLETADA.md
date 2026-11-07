# Fase 1 · Base de datos

## Resultado de `npm run db:verificar`

```text
> tributate-ya@0.1.0 db:verificar
> node --env-file=.env.local scripts/verificar-bd.mjs

(node:22148) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
(Use `node --trace-warnings ...` to show where the warning was generated)
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

Error: read ECONNRESET
    at TCP.onStreamRead (node:internal/stream_base_commons:216:20) {
  errno: -4077,
  code: 'ECONNRESET',
  syscall: 'read'
}

Node.js v24.21.0
```

## Estado
La verificación de la base de datos quedó bloqueada por una conexión TCP reset de Supabase desde este entorno. La infraestructura y scripts quedaron preparados, pero la validación final exige que la conexión DB sea accesible desde la máquina actual.
