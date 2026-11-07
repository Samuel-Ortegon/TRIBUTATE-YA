# Estado de ejecución · Agenda Tributaria para Contador

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | ok | pendiente | 2026-10-31 |
| P01 Base de datos | completado | ok | ok | 2026-11-07 |
| P02 Reglas de negocio | completado | ok | ok | 2026-11-07 |
| P03 Servidor | bloqueado: falta acceso de contador para validar sesión | ok | ok | |
| P04 Datos: clientes, calendario, agenda | completado | ok | ok | 2026-11-07 |
| P05 Datos: pagos, revisión, trámite | completado | ok | ok; flujo 14/14 | 2026-11-07 |
| P06 API pública | completado | ok | API 12/12 | 2026-11-07 |
| P07 Pantallas públicas | implementado; smoke ok | ok | ok | 2026-11-07 |
| P08 API del contador | implementado; sesión pendiente | ok | anónimo 401 | |
| P09 Panel: base, resumen, clientes | implementado; sesión pendiente | ok | ok | |
| P10 Panel: detalle y acciones | implementado; sesión pendiente | ok | ok | |
| P11 Panel: agenda, pagos, calendario | implementado; sesión pendiente | ok | ok | |
| P12 Aceptación | bloqueado: requiere sesión autenticada del contador | | | |
| P13 Opcionales A | pendiente | | | |
| P14 Opcionales B | pendiente | | | |

## Bitácora

### P00 Auditoría del repositorio
- Archivos creados: `DOC/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `DOC/ESTADO_EJECUCION.md`, `DOC/checkpoints/FASE_0_COMPLETADA.md`
- Archivos modificados: ninguno
- Comandos ejecutados:
  - `npm run build` -> falló por dependencias faltantes (`@vercel/connect`, `resend`)
  - `npm install` -> falló por error `ECONNRESET` de la red npm
- Problemas encontrados: la red no permite descargar paquetes desde npm; el proyecto no tiene todas las dependencias instaladas correctamente.
- Cómo se resolvió: se registró el estado real del repositorio y se dejó listo el punto de partida para continuar con la ejecución local.
- Pendientes: resolver la instalación de paquetes o crear stubs locales para ejecutar la app sin red.

### P01 Base de datos del módulo
- Archivos creados: `supabase/migrations/20261004000000_agenda_tablas.sql`, `supabase/migrations/20261004000001_agenda_vista_seguridad.sql`, `supabase/migrations/20261004000002_agenda_calendario_demo.sql`, `scripts/db-client.mjs`, `scripts/migrar.mjs`, `scripts/verificar-bd.mjs`
- Archivos modificados: `package.json`, `.env.local`, `.env.example`
- Comandos ejecutados:
  - `npm run db:migrar` -> falló con `read ECONNRESET`
  - `npm run db:verificar` -> falló con `read ECONNRESET`
  - `npm run build` -> ok
- Problemas encontrados: el pooler devuelve `ECONNRESET`; la conexión directa, sin pooler, sí acepta la sesión TLS.
- Cómo se resolvió: el cliente de migraciones usa TLS y acepta certificados sin validación de identidad, como se solicitó. Se usará la URL directa existente en `.env.local` para evitar el pooler.
- Resultado: las tres migraciones se aplicaron en Supabase. Se verificaron tablas, vista, índices parciales, RLS y datos demo; las reglas de cruce de citas y cita única activa pasaron.
- Se corrigió el verificador para comparar `error.code` de PostgreSQL, en lugar de buscar el código SQLSTATE en el texto del error.
- Los scripts de migración/verificación priorizan `TRIBUTATE_YA_POSTGRES_URL_NON_POOLING`, que funciona en este entorno; luego usan `DATABASE_URL` y finalmente `TRIBUTATE_YA_POSTGRES_URL`.

### Verificación posterior de P01
- Diagnóstico actualizado: la conexión directa de PostgreSQL funciona; el pooler da `ECONNRESET`.
- Cambios conservados: `scripts/db-client.mjs` habilita TLS aceptando cualquier certificado según lo solicitado; `scripts/migrar.mjs` y `scripts/verificar-bd.mjs` usan ese cliente y priorizan la conexión directa.
- Validación: `npm.cmd run build` -> ok; `npm.cmd test` -> ok (2 archivos, 2 pruebas); comprobación sintáctica de los scripts -> ok.
- Validación de Supabase: `npm run db:migrar` -> ok; `npm run db:verificar` -> ok.

### P02 Reglas de negocio y pruebas unitarias
- Archivos creados: `src/lib/config/negocio.ts`, `src/lib/reglas/{errores,fechas,estados,pagos,agenda,revisiones,calendario,privacidad}.ts`, `tests/reglas/` (siete módulos de pruebas y `ayudas.ts`), `DOC/checkpoints/FASE_2_COMPLETADA.md`
- Archivos modificados: `vitest.config.ts`, `package.json`, `DOC/ESTADO_ACTUAL.md`, `DOC/ESTADO_EJECUCION.md`
- Resultado: implementadas las reglas puras de negocio, con errores/mensajes/HTTP, configuración y validaciones de agenda, pagos, trámite, revisiones, calendario y privacidad. Se cubren los 36 casos T-01 a T-36.
- Validaciones: `npm.cmd test` -> ok (9 archivos, 38 pruebas: 36 de P02 y 2 previas); `npm.cmd run type-check` -> ok; `npm.cmd run build` -> ok.
- No se modificaron rutas, login ni base de datos. No se hizo commit.

### P03 Infraestructura del servidor — implementación lista, verificación manual bloqueada
- Archivos creados: `src/lib/db/conexion.ts`, `src/lib/auth/sesionContador.ts`, `src/lib/http/respuestas.ts`, `src/lib/validacion/esquemas.ts`, `src/lib/formato.ts`, `src/app/api/contador/sesion/route.ts`, `src/types/pg.d.ts`, pruebas de infraestructura en `tests/reglas/`, `DOC/checkpoints/FASE_3_PENDIENTE.md`
- Archivos modificados: `src/middleware.ts`, `src/app/login/page.tsx`, `DOC/ESTADO_ACTUAL.md`, `DOC/ESTADO_EJECUCION.md`
- Implementación: pool Postgres compartido y transacciones; adaptador de Supabase Auth; protección de páginas y APIs del contador; redirección de login a `/contador`; respuestas de API, esquemas Zod y formatos solicitados.
- Validaciones: `npm.cmd run build` -> ok; `npm.cmd test` -> ok (11 archivos, 53 pruebas); `npm.cmd run type-check` -> ok. En local, `/api/contador/sesion` sin cookie respondió 401 con `Cache-Control: no-store`; `/contador` redirigió a `/login`; `/login` respondió 200.
- El prompt del login cambia únicamente el destino del acceso correcto: `/prueba-correo` -> `/contador`. No se modificó el endpoint de login ni la autenticación existente.
- La sesión autenticada no se pudo verificar: los intentos disponibles recibieron 401 y el estudiante indicó que no cuenta con credenciales válidas o acceso. P03 permanece bloqueado hasta validar `/api/contador/sesion` con sesión, antes de P04.
- Desviación de ejecución local: P03 usó `next dev` directamente porque el antiguo script `dev` intentaba descargar y escribir un token en `.env.local`.
- Tipos PostgreSQL: `@types/pg` está declarado en el proyecto, pero no está instalado en `node_modules`; su restauración offline falló porque no hay copia en caché. Se agregó una declaración local acotada para las APIs usadas, sin añadir dependencias.
- No se hizo commit.

### P04–P11 Datos, API pública y panel del contador
- Archivos creados: `src/lib/datos/` (clientes, citas, calendario, pagos, revisiones/trámite, resumen y tipos), `src/lib/dataService.ts`, rutas `src/app/api/publico/` y `src/app/api/contador/`, páginas `/`, `/registro`, `/consulta`, `/agendar` y `/contador/*`, componentes `src/components/contador/` y `src/components/publico/`, `scripts/limpiar-cliente.mjs`, `scripts/probar-flujo.ts`, `scripts/probar-api.mjs`, `scripts/vite.config.ts`, `DOC/checkpoints/FASE_4_COMPLETADA.md`, `DOC/checkpoints/FASE_5_COMPLETADA.md`.
- Archivos modificados: `src/lib/db/conexion.ts`, `src/types/pg.d.ts`, `src/lib/validacion/esquemas.ts`, `src/app/globals.css`, `src/app/page.tsx`, `package.json`, `DOC/ESTADO_ACTUAL.md`, `DOC/ESTADO_EJECUCION.md`.
- Problema corregido: `pg` daba `SELF_SIGNED_CERT_IN_CHAIN` porque los parámetros SSL de la URL sobrescribían la opción de TLS. La conexión elimina esos parámetros y mantiene TLS con la opción ya acordada.
- Arranque local: se dejó `npm run dev` conectado directamente a Next.js y `npm run dev:vercel` para la obtención opcional del token. Se comprobó que `.env.local` no fue reescrito.
- Validaciones de base de datos: `npm run probar:flujo` -> 14 pasos OK, 0 fallas; limpieza final eliminó únicamente los dos clientes de prueba, sus cuatro pagos, una cita, una revisión y 11 eventos.
- Validaciones de API: `npm run probar:api` -> 12 pasos OK, 0 fallas; limpieza final eliminó únicamente el cliente, su cita y tres eventos de prueba.
- Smoke web/API: portada, registro, consulta y agenda HTTP 200; disponibilidad pública HTTP 200; API contador sin sesión HTTP 401; `/contador` sin sesión redirige al login. Se abrió la portada y agenda en el navegador.
- Validaciones finales: `npm.cmd run build` -> ok; `npm.cmd test` -> ok (11 archivos, 53 pruebas); `npm.cmd run lint` -> ok; `npm.cmd run type-check` -> ok.
- Pendiente de aceptación: probar el inicio de sesión real y recorrer el panel con la cuenta del contador; no se dispone de una sesión autenticada en este contexto. No se modificó ni se imprimió ningún valor de `.env.local`. No se hizo commit.
