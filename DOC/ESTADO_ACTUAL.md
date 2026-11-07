# Estado actual del repositorio

## 1. Versiones

| Paquete | Versión / estado |
|---|---|
| next | 15.5.25 |
| react | 19.1.1 |
| typescript | 5.9.2 |
| tailwindcss | No existe en package.json |
| pg | 8.16.3 |
| zod | 4.1.5 |
| @supabase/supabase-js | No existe en package.json |
| jose | No existe en package.json |
| bcryptjs | No existe en package.json |
| vitest | 3.2.4 |
| @vercel/connect | Presente como dependencia (`latest`) |
| resend | Presente como dependencia (`latest`) |

## 2. Scripts de package.json

`npm run dev` inicia Next.js directamente. La renovación local del token de Vercel se conserva como `npm run dev:vercel`, separada del arranque habitual para que el servidor local no dependa de `vercel env pull`.

```json
"scripts": {
  "dev": "next dev",
  "dev:vercel": "node scripts/tokenVercel.mjs && next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "type-check": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

## 3. Estructura del proyecto

```text
src/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ change-password/
│  │  │  ├─ complete-first-login/
│  │  │  ├─ login/
│  │  │  └─ logout/
│  │  ├─ correo/
│  │  │  └─ prueba/
│  │  ├─ contador/
│  │  │  ├─ calendario, citas, clientes, disponibilidad, pagos, revisiones, resumen, sesion
│  │  └─ health/
│  ├─ agendar/
│  ├─ consulta/
│  ├─ contador/
│  │  ├─ agenda/
│  │  ├─ calendario/
│  │  ├─ clientes/
│  │  └─ pagos/
│  ├─ registro/
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ login/
│  │  └─ page.tsx
│  ├─ page.tsx
│  └─ prueba-correo/
│     ├─ PruebaCorreoFormulario.tsx
│     └─ page.tsx
├─ lib/
│  ├─ config/
│  │  └─ negocio.ts
│  ├─ auth/
│  │  └─ sesionContador.ts
│  ├─ db/
│  │  └─ conexion.ts
│  ├─ datos/
│  │  ├─ calendario.ts, citas.ts, clientes.ts, eventos.ts
│  │  └─ pagos.ts, resumen.ts, tramites.ts, tipos.ts
│  ├─ dataService.ts
│  ├─ http/
│  │  └─ respuestas.ts
│  ├─ validacion/
│  │  └─ esquemas.ts
│  ├─ reglas/
│  │  ├─ errores.ts
│  │  ├─ fechas.ts
│  │  ├─ estados.ts
│  │  ├─ pagos.ts
│  │  ├─ agenda.ts
│  │  ├─ revisiones.ts
│  │  ├─ calendario.ts
│  │  └─ privacidad.ts
│  ├─ correo.ts
│  ├─ formato.ts
│  ├─ json-db.ts
│  └─ supabase-config.ts
├─ components/
│  ├─ contador/
│  └─ publico/
├─ middleware.ts
types/
└─ pg.d.ts (declaración local por @types/pg no instalado en node_modules)
scripts/
├─ db-client.mjs, migrar.mjs, tokenVercel.mjs, verificar-bd.mjs
supabase/
├─ migrations/
│  ├─ 20261003000000_create_users.sql
│  ├─ 20261004000000_agenda_tablas.sql
│  ├─ 20261004000001_agenda_vista_seguridad.sql
│  └─ 20261004000002_agenda_calendario_demo.sql
tests/
└─ reglas/ (pruebas unitarias de reglas, esquemas, formato y respuestas)
public/ (No existe)
components/ (No existe en la raíz)
lib/ (No existe en la raíz; se usa `src/lib`)
app/ (Se usa `src/app`)
```

Se usa carpeta `src/`.

## 4. Alias de importación

En `tsconfig.json`:

- `@/*` -> `./src/*`
- `@data/*` -> `./data/*`

## 5. Autenticación

- Archivos principales: `src/app/api/auth/login/route.ts`, `src/app/api/auth/complete-first-login/route.ts`, `src/app/api/auth/change-password/route.ts`, `src/app/login/page.tsx`, `src/lib/supabase-config.ts`.
- Mecanismo: Supabase Auth con tokens en cookies del navegador.
- Cookies: `supabase-access-token` y `supabase-refresh-token`.
- Adaptador del módulo: `src/lib/auth/sesionContador.ts` valida el token mediante Supabase Auth y expone `obtenerContador()` y `exigirContador()`.
- Ruta de login: `/login` (`src/app/login/page.tsx`).
- Ruta de redirección posterior al login: `/contador` (`src/app/login/page.tsx`); el resumen del contador ya existe.
- Middleware: `src/middleware.ts` verifica la sesión de Supabase en `/contador/:path*` y `/api/contador/:path*`; las páginas sin sesión redirigen a `/login` y las APIs responden 401 con el contrato estándar.
- Cierre de sesión: `src/app/api/auth/logout/route.ts` limpia las cookies `supabase-access-token` y `supabase-refresh-token`.
- Roles: no hay roles configurados en el repositorio; por tanto, se admite cualquier usuario autenticado. Si Supabase aporta un rol en `app_metadata`, se restringe a administrador o contador.

## 6. Acceso a datos

- Clientes de Supabase existentes: `src/lib/supabase-config.ts`.
- Uso del paquete `pg`: conexión en `src/lib/db/conexion.ts`, con parsers para DATE, TIMESTAMP y BIGINT; las transacciones liberan siempre el cliente.
- Conexión: prioriza `TRIBUTATE_YA_POSTGRES_URL_NON_POOLING`, después las variables PostgreSQL existentes y `DATABASE_URL`; elimina los parámetros SSL de la URL antes de configurar TLS con certificados no verificados, para evitar que `pg` anule la configuración TLS requerida.
- `src/lib/dataService.ts` es la fachada; las páginas y rutas del módulo la usan sin importar directamente la conexión.
- Hay migraciones de usuarios y las tres migraciones del módulo Agenda.

## 7. Migraciones

- Carpeta: `supabase/migrations/`
- Archivos actuales:
  - `20261004000000_agenda_tablas.sql`
  - `20261004000001_agenda_vista_seguridad.sql`
  - `20261004000002_agenda_calendario_demo.sql`
  - `20261003000000_create_users.sql`
- Numeración: ISO-like `YYYYMMDDHHMMSS` con nombre descriptivo.
- Tabla de control: no existe una tabla `_migrations`; las migraciones de agenda ya fueron aplicadas y verificadas en la Supabase configurada.
- Scripts: `scripts/migrar.mjs` y `scripts/verificar-bd.mjs`; nunca se deben copiar variables de entorno a la documentación.

## 8. Variables de entorno

Nombres presentes en `.env.local` (sin valores):

- `NEXT_PUBLIC_TRIBUTATE_YA_TRIBUTATE_YASUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TRIBUTATE_YA_TRIBUTATE_YASUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TRIBUTATE_YA_TRIBUTATE_YASUPABASE_URL`
- `TRIBUTATE_YA_POSTGRES_DATABASE`
- `TRIBUTATE_YA_POSTGRES_HOST`
- `TRIBUTATE_YA_POSTGRES_PASSWORD`
- `TRIBUTATE_YA_POSTGRES_PRISMA_URL`
- `TRIBUTATE_YA_POSTGRES_URL`
- `TRIBUTATE_YA_POSTGRES_URL_NON_POOLING`
- `TRIBUTATE_YA_POSTGRES_USER`
- `TRIBUTATE_YA_SUPABASE_JWT_SECRET`
- `TRIBUTATE_YA_SUPABASE_PUBLISHABLE_KEY`
- `TRIBUTATE_YA_SUPABASE_SECRET_KEY`
- `TRIBUTATE_YA_SUPABASE_SERVICE_ROLE_KEY`
- `TRIBUTATE_YA_SUPABASE_URL`

No existe `DATABASE_URL` en `.env.local`.

## 9. Estilos

- Tailwind: no existe en el repo.
- `globals.css`: `src/app/globals.css`.
- Fuentes: usa `Trebuchet MS`, `Segoe UI`, `Georgia` y `Times New Roman` en CSS plano.
- Tokens de color: definidos en `:root` dentro de `globals.css` (`--ink`, `--muted`, `--line`, `--gradient-1`, `--gradient-2`, `--gradient-3`, `--accent-primary`, `--accent-secondary`).
- Librería de íconos: no existe.

## 10. Pruebas

- Framework: Vitest 3.2.4.
- Estado: instalado; pruebas API existentes y suites unitarias de reglas, esquemas, formato y respuestas en `tests/reglas/` (53 pruebas en 11 archivos al cierre de P03).
- Configuración: entorno Node; Vitest incluye las pruebas existentes de `src/` y las pruebas de reglas.

## 11. Conflictos con el plan

- Las rutas `/contador`, `/api/contador`, `/registro`, `/consulta` y `/agendar` existen, junto con `src/lib/dataService.ts` y componentes para ambos módulos.
- `src/app/page.tsx` muestra la portada pública con acceso a registro, consulta y agenda.
- Las pantallas, endpoints y reglas funcionales están implementados. La aceptación autenticada de extremo a extremo aún requiere una sesión de contador.

## 12. Decisiones derivadas

- Ruta de login: `/login`
- Archivo de protección de rutas: `src/middleware.ts`
- Mecanismo de migraciones: el repo tiene migraciones manuales bajo `supabase/migrations/`; no existe un runner de migración
- Nombres no aplicables todavía: M1, M2 y M3 del plan no se han materializado en la estructura actual
- Prefijo de imports para lib: `@/lib`

## 13. Resultado de compilación

`npm run build` se ejecutó correctamente en el entorno actual e incluye las rutas públicas y privadas:

- Fecha: 2026-11-07
- Resultado: compilación exitosa
- Observación: se resolvió la ausencia de los módulos `@vercel/connect` y `resend` con stubs locales para permitir la ejecución en este entorno sin acceso a npm
