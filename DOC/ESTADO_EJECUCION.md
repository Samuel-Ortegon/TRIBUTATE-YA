# Estado de ejecución · Agenda Tributaria para Contador

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | completado | ok | pendiente | 2026-10-31 |
| P01 Base de datos | completado | ok | ok | 2026-11-07 |
| P02 Reglas de negocio | completado | ok | ok | 2026-11-07 |
| P03 Servidor | completado; sesión verificada en aceptación | ok | ok | 2026-11-14 |
| P04 Datos: clientes, calendario, agenda | completado | ok | ok | 2026-11-07 |
| P05 Datos: pagos, revisión, trámite | completado | ok | ok; flujo 14/14 | 2026-11-07 |
| P06 API pública | completado | ok | API 12/12 | 2026-11-07 |
| P07 Pantallas públicas | completado; smoke ok | ok | ok | 2026-11-07 |
| P08 API del contador | completado; sesión verificada en aceptación | ok | anónimo 401; autenticado ok | 2026-11-14 |
| P09 Panel: base, resumen, clientes | completado en aceptación | ok | ok | 2026-11-14 |
| P10 Panel: detalle y acciones | completado en aceptación | ok | ok | 2026-11-14 |
| P11 Panel: agenda, pagos, calendario | completado en aceptación | ok | ok | 2026-11-14 |
| P12 Aceptación | completado; 18/18 casos HTTP aprobados en Vercel | ok | ok (56 pruebas) | 2026-11-14 |
| P13 Opcionales A | completado | ok | ok (58 pruebas en conjunto) | 2026-11-14 |
| P14 Opcionales B | implementado; correo real requiere clave/dominio habilitados | ok | ok (58 pruebas en conjunto) | 2026-11-14 |

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

### Diagnóstico de acceso en producción — 2026-11-11
- El usuario reportó que al iniciar sesión no llega al panel. La página actual redirige a `/contador` tras una respuesta de autenticación exitosa; el despliegue activo no contenía esa versión.
- Vercel reportó como `ERROR` el despliegue del commit `1ca38af`, con `npm install` fallido por `ERESOLVE`: `@vercel/connect: latest` instalaba dependencias opcionales que requerían Vite 8, mientras que las pruebas del proyecto usan Vite 7.
- Se fijaron versiones numéricas para Vercel Connect y Resend, y se agregó un lockfile sincronizado. `.npmrc` desactiva la resolución automática de peers opcionales: Vercel Connect los declara para integraciones que esta aplicación no usa, y su instalación automática estaba introduciendo un Vite incompatible con Vitest.
- Validación de la corrección: `npm ci --no-audit`, `npm.cmd run build`, `npm.cmd test` (53 pruebas), `npm.cmd run lint` y `npm.cmd run type-check` -> correctos.
- La corrección del login en producción requiere que este cambio llegue a un nuevo despliegue. La aceptación con una sesión real sigue pendiente.

### Ajuste de reprogramación de citas pagadas — 2026-11-11
- Se actualizó el panel para mostrar «Reprogramar cita» según la existencia de una cita que siga activa (`agendada`), incluso si el estado general del cliente ya avanzó por el pago.
- Se conserva la validación del servidor: solo se reprograman citas activas y la operación conserva el pago confirmado.
- Se agregó una prueba unitaria de la visibilidad de la acción cuando hay cita activa.
- Validaciones: build, lint y type-check correctos; `npm.cmd test` -> 54 pruebas aprobadas.
- Se añadió reprogramación pública de citas pagadas o con el pago en revisión, con validación de cédula y últimos cuatro dígitos, disponibilidad, anticipación mínima y conservación del pago. La cancelación pública sigue deshabilitada para esos pagos.
- Validaciones finales: build, lint y type-check correctos; `npm.cmd test` -> 56 pruebas aprobadas.

### Cierre de implementación y preparación de aceptación — 2026-11-14
- Se volvió a validar la reprogramación pública de citas pagadas/en revisión, sin crear ni modificar usuarios. El usuario nuevo queda expresamente pospuesto.
- Documentación: `README.md` y `DOC/ACEPTACION.md`; A-01–A-18 aprobados por flujos HTTP/API en Vercel. A-07, A-14 y A-17 no fueron inspecciones visuales.
- Validaciones ejecutadas:
  - `npm.cmd test` -> 56 pruebas aprobadas en 11 archivos.
  - `npm.cmd run build` -> correcto.
  - `npm.cmd run lint` -> correcto.
  - `npm.cmd run type-check` -> correcto.
  - `npm.cmd run probar:flujo` -> 14 pasos correctos, 0 fallas; datos temporales de prueba limpiados.
  - `npm.cmd run probar:api` -> 12 pasos correctos, 0 fallas; datos temporales de prueba limpiados.
  - `npm.cmd run db:verificar` -> tablas, vista, índices, RLS y reglas 2/8 verificados.
  - `git diff --check` -> correcto.
- Auditoría P12: las rutas `/api/contador/*` verifican `exigirContador()` al inicio de sus handlers; las respuestas públicas usan contratos resumidos y no devuelven cédula, teléfono, correo ni identificador de cliente; los montos se validan como enteros; las reglas de negocio de fecha actual están centralizadas en `ahoraBogota`; el SQL utiliza parámetros para valores y las columnas dinámicas de actualización se seleccionan desde campos permitidos por el esquema. `.env.local` está ignorado y no está versionado.
- La búsqueda de `new Date()` también encontró usos para formatear/validar fechas o emitir marcas de tiempo en rutas auxiliares; no se usan para reemplazar el reloj de negocio fuera de `lib/reglas/fechas.ts`.
- P12 quedó completado con los 18 casos aprobados en HTTP/API; se usaron datos ficticios y un usuario temporal, eliminados al finalizar. La aceptación no fue una inspección visual.
- Producción sigue en `b881820`; los cambios de reprogramación pública y las fases P13/P14 de este worktree todavía requieren publicación para validarse en Vercel.

### P13–P14 Opcionales y cierre — 2026-11-14
- P13: filtro por estado combinado con búsqueda, tarjeta de fechas próximas (hoy a 15 días) e historial de eventos con descripciones y fechas de Bogotá.
- P14: agenda semanal de lunes a viernes con celdas según el horario configurado; notas de contador con validación, registro de evento y API protegida; confirmación por correo luego de confirmar la transacción de cita.
- Migración `20261004000003_notas_cliente.sql` aplicada con `npm.cmd run db:migrar`; limpieza de clientes de prueba actualizada para eliminar notas. `scripts/verificar-bd.mjs` incluye la tabla y verifica su RLS.
- Resend es opcional: si no existe `RESEND_API_KEY`, el envío se omite con aviso. Si Resend rechaza el envío, la cita se conserva y el error se registra.
- Validaciones: `npm.cmd test` -> 58 pruebas aprobadas; `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run type-check`, `npm.cmd run db:migrar`, `npm.cmd run db:verificar` y `git diff --check` correctos.
- No se creó el usuario contador solicitado anteriormente, no se hizo commit ni push y no se modificó `.env.local`.
