# Tributate Ya

Aplicación web para que personas naturales consulten su fecha límite tributaria, se registren y gestionen una cita de orientación. El contador administra clientes, citas, pagos, revisiones y el calendario tributario.

## Funcionalidades

- Registro de clientes y consulta de fechas límite a partir del calendario tributario.
- Solicitud, consulta, cancelación y reprogramación de citas. La reprogramación pública conserva pagos confirmados o en revisión.
- Panel del contador con agenda diaria/semanal, vencimientos próximos, notas e historial del cliente; gestiona pagos, revisiones, trámites y calendario tributario.
- Correo de confirmación de cita mediante Resend cuando `RESEND_API_KEY` está configurada.
- Validaciones de agenda, pagos y estados del trámite en reglas de negocio y en PostgreSQL.
- Autenticación del contador con Supabase Auth.

La aplicación registra información de pagos; no procesa transferencias ni calcula si una persona está obligada a declarar.

## Requisitos

- Node.js y npm.
- Un proyecto Supabase configurado con Auth y PostgreSQL.
- Variables de entorno configuradas en `.env.local` para desarrollo y en el entorno de despliegue. No publiques sus valores.

La aplicación reconoce `TRIBUTATE_YA_SUPABASE_URL` y las claves públicas de Supabase definidas en `src/lib/supabase-config.ts`. PostgreSQL usa, en este orden, `TRIBUTATE_YA_POSTGRES_URL_NON_POOLING`, `TRIBUTATE_YA_POSTGRES_URL` o `DATABASE_URL`. Consulta `.env.example` y `DOC/ESTADO_ACTUAL.md` para los nombres disponibles. No compartas claves administrativas.

## Desarrollo local

```powershell
npm install
# Configura las variables necesarias en .env.local
npm run db:migrar
npm run dev
```

La app queda disponible en `http://localhost:3000`. Las migraciones se aplican desde `supabase/migrations/`; revisa el proyecto y la conexión antes de ejecutarlas, ya que modifican la base de datos configurada.

Para habilitar correos, define `RESEND_API_KEY` en `.env.local` y `CORREO_REMITENTE` solo si el remitente está verificado en Resend. Con `onboarding@resend.dev`, Resend limita la entrega a la dirección asociada a la cuenta. Configura también la clave en las variables de entorno de Vercel.

## Scripts

| Comando | Propósito |
|---|---|
| `npm run dev` | Iniciar Next.js localmente |
| `npm run dev:vercel` | Iniciar localmente después de intentar renovar el token de Vercel Connect |
| `npm run build` | Compilar para producción |
| `npm run start` | Servir la compilación |
| `npm run lint` | Ejecutar ESLint |
| `npm run type-check` | Verificar tipos de TypeScript |
| `npm test` | Ejecutar las pruebas Vitest |
| `npm run db:migrar` | Aplicar migraciones pendientes |
| `npm run db:verificar` | Verificar estructura y reglas de la base de datos |
| `npm run probar:flujo` | Probar el flujo de datos contra PostgreSQL; crea y elimina clientes de prueba |
| `npm run probar:api` | Probar la API pública contra el servidor local; crea y elimina un cliente de prueba |
| `npm run db:limpiar -- <cédula...>` | Eliminar los datos asociados a las cédulas indicadas; úsalo solo con datos de prueba |

## Reglas de negocio

| Regla | Aplicación |
|---|---|
| RN-01 · Primera consulta de $50.000 | `evaluarMonto` en `src/lib/reglas/pagos.ts` |
| RN-02 · Citas de 30 minutos sin cruces | `seCruzan` en `src/lib/reglas/agenda.ts` y restricción `citas_sin_cruce` |
| RN-03 · La revisión requiere pago confirmado de consulta | Transición de estado y validación del pago en `src/lib/datos/tramites.ts` |
| RN-04 · Resultado de revisión con opciones permitidas | Esquema Zod y restricción de base de datos |
| RN-05 · Servicio de $300.000 solo si debe declarar | `validarRegistroPago` y `evaluarMonto` en `src/lib/reglas/pagos.ts` |
| RN-06 · Iniciar trámite requiere resultado y pago confirmados | `puedeIniciarTramite` y validación transaccional |
| RN-07 · Vencimientos según la fecha de Bogotá | `estadoFechaLimite` en `src/lib/reglas/fechas.ts` |
| RN-08 · Una cita activa por cliente | Índice `ux_citas_una_activa_por_cliente` |

## Estructura

```text
src/app/                 Páginas y rutas API de Next.js
src/components/          Componentes de interfaz pública y del contador
src/lib/reglas/           Reglas de negocio puras
src/lib/datos/            Consultas y operaciones transaccionales
src/lib/db/               Conexión PostgreSQL
supabase/migrations/      Migraciones SQL
scripts/                  Migración, verificación y pruebas de flujo/API
tests/                    Pruebas automatizadas
DOC/                      Plan y estado de ejecución del proyecto
```

## Documentación

- [Plan técnico de Agenda Tributaria](DOC/PLAN%20AGENDA%20TRIBUTARIA.md)
- [Estado de ejecución](DOC/ESTADO_EJECUCION.md)
- [Guía de aceptación manual](DOC/ACEPTACION.md)

La aceptación autenticada del panel debe ejecutarse en el despliegue de Vercel con una cuenta autorizada de contador.
