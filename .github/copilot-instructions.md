# Agenda Tributaria para Contador · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_AGENDA_TRIBUTARIA.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + CSS Modules/estilos propios. Despliegue en Vercel.
- Postgres de Supabase con la variable DATABASE_URL cuando exista; en este repositorio actual no aparece en `.env.local`.
- Validación con Zod. Pruebas con Vitest.
- Login existente: Supabase Auth mediante rutas API en `src/app/api/auth/login/route.ts`, `src/app/api/auth/complete-first-login/route.ts` y `src/app/api/auth/change-password/route.ts`; se guardan los tokens en cookies `supabase-access-token` y `supabase-refresh-token`. No se reescribe.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Comentarios breves, solo donde aclaran una regla.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin variables de entorno y sin leer el reloj (excepto ahoraBogota en fechas.ts).
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/contador/ llama await exigirContador() como primera instrucción.
- Entradas validadas con los esquemas de lib/validacion/esquemas.ts.
- Errores de negocio con ErrorDeNegocio(codigo); respuestas con lib/http/respuestas.ts.
- Montos en pesos enteros. Nunca decimales.
- Fechas 'YYYY-MM-DD' y horas 'HH:MM' como texto entre capas. Zona horaria America/Bogota.
- En rutas dinámicas params es una Promise: const { id } = await params.
- SQL siempre con parámetros ($1, $2). Nunca concatenar valores.
- No usar localStorage para datos del negocio.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: @/lib.
- Archivo de protección de rutas: `src/middleware.ts` (existe, pero actualmente es un pass-through sin protección real).
- Ruta de login: /login.

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa los cambios y hace el commit.
