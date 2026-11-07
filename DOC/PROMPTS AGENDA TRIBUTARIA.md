# Agenda Tributaria para Contador · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_AGENDA_TRIBUTARIA.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: proyecto desplegado en Vercel, Supabase conectado y login funcionando

---

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_AGENDA_TRIBUTARIA.md` y `PROMPTS_AGENDA_TRIBUTARIA.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt:
   - Revisar los cambios propuestos y aceptarlos (**Keep**).
   - Hacer la verificación indicada en "Verificación del estudiante".
   - Hacer commit con el mensaje sugerido y `git push`. Vercel desplegará automáticamente; si el despliegue falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final de este archivo.

| Fase | Prompts |
|---|---|
| 0 · Preparación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y casos de uso | P04, P05 |
| 5 · Módulo público | P06, P07 |
| 6 · Panel del contador | P08, P09, P10, P11 |
| 7 · Aceptación | P12 |
| 8 · Opcionales | P13, P14 |

---

## P00 · Auditoría del repositorio y archivos de control

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio Next.js.

Contexto: el proyecto "Agenda Tributaria para Contador" ya está desplegado en Vercel, conectado a Supabase y tiene login funcionando. El plan técnico está en doc/PLAN_AGENDA_TRIBUTARIA.md. Este prompt NO implementa funcionalidades: audita el repositorio y crea los archivos de control que usarán los prompts siguientes.

Lee completo doc/PLAN_AGENDA_TRIBUTARIA.md, en especial las secciones 0, 1, 8 y 15.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con estas secciones, llenas con lo que encuentres en el repositorio. No supongas: si algo no existe, escribe "No existe".
1. Versiones (desde package.json): next, react, typescript, tailwindcss, pg, zod, @supabase/supabase-js, jose, bcryptjs, vitest.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/ y scripts/ hasta 3 niveles. Indica si el proyecto usa carpeta src/.
4. Alias de importación definidos en tsconfig.json.
5. Autenticación: archivos involucrados; mecanismo (JWT propio en cookie, Supabase Auth u otro); nombre de la cookie; función que lee la sesión y qué devuelve; ruta de la página de login; ruta a la que redirige después del login (archivo y línea); archivo de middleware o proxy y su matcher; cómo se cierra sesión; tabla de usuarios y roles, si existen.
6. Acceso a datos: clientes de Supabase existentes (archivos), uso del paquete pg, archivo de pool si existe.
7. Migraciones: carpeta, archivos existentes y su numeración, tabla de control (_migrations u otra), script o página que las aplica.
8. Variables de entorno: solo los NOMBRES presentes en .env.local y .env.example (nunca copies valores). Indica explícitamente si existe DATABASE_URL.
9. Estilos: versión de Tailwind, ubicación de globals.css, fuentes, tokens de color existentes, librería de íconos.
10. Pruebas: framework existente.
11. Conflictos con el plan: existencia previa de app/contador, app/api/contador, app/registro, app/consulta, app/agendar, lib/dataService.ts y components/ui; contenido actual de app/page.tsx (plantilla de Next.js o contenido propio).
12. Decisiones derivadas:
    - Ruta de la página de login.
    - Archivo de protección de rutas a usar (proxy.ts en Next.js 16, middleware.ts en versiones anteriores) y si ya existe.
    - Mecanismo de migraciones a usar (el existente o scripts/migrar.mjs).
    - Nombres exactos que tendrán M1, M2 y M3 continuando la numeración existente (sección 7 del plan).
    - Prefijo de imports para lib (por ejemplo @/lib o @/src/lib).
13. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea .github/copilot-instructions.md con el contenido siguiente. Reemplaza únicamente las partes marcadas [AJUSTAR] con lo encontrado en la TAREA 1:

```markdown
# Agenda Tributaria para Contador · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_AGENDA_TRIBUTARIA.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable DATABASE_URL.
- Validación con Zod. Pruebas con Vitest.
- Login existente: [AJUSTAR: mecanismo y archivos principales]. No se reescribe.

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
- Prefijo de imports para lib: [AJUSTAR].
- Archivo de protección de rutas: [AJUSTAR: proxy.ts o middleware.ts].
- Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa los cambios y hace el commit.
```

TAREA 3. Crea doc/ESTADO_EJECUCION.md con esta plantilla:

```markdown
# Estado de ejecución · Agenda Tributaria para Contador

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | pendiente | | | |
| P01 Base de datos | pendiente | | | |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos: clientes, calendario, agenda | pendiente | | | |
| P05 Datos: pagos, revisión, trámite | pendiente | | | |
| P06 API pública | pendiente | | | |
| P07 Pantallas públicas | pendiente | | | |
| P08 API del contador | pendiente | | | |
| P09 Panel: base, resumen, clientes | pendiente | | | |
| P10 Panel: detalle y acciones | pendiente | | | |
| P11 Panel: agenda, pagos, calendario | pendiente | | | |
| P12 Aceptación | pendiente | | | |
| P13 Opcionales A | pendiente | | | |
| P14 Opcionales B | pendiente | | | |

## Bitácora

Cada prompt agrega una sección con: archivos creados, archivos modificados, comandos ejecutados y su resultado, problemas encontrados y cómo se resolvieron, pendientes.
```

TAREA 4. Si no existe node_modules, ejecuta npm install. Luego ejecuta npm run build y registra el resultado en la sección 13 de ESTADO_ACTUAL.md. Si la compilación falla, NO corrijas nada: describe el error.

TAREA 5. Si DATABASE_URL no existe en .env.local, explícame al final, en lenguaje sencillo, cómo obtenerla:
- En el panel de Supabase, botón "Connect", opción de cadena de conexión "Transaction pooler" (puerto 6543).
- Reemplazar [YOUR-PASSWORD] por la contraseña de la base de datos.
- Agregarla a .env.local como DATABASE_URL=...
- Agregarla también en Vercel (Settings, Environment Variables) para Production, Preview y Development.
Indica que no se debe continuar con P01 hasta tenerla.

RESTRICCIONES: no modifiques ningún archivo de código, configuración ni dependencias. Solo crea los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: resultado de la compilación, existencia de DATABASE_URL, mecanismo de login detectado y las decisiones derivadas.
- En ESTADO_EJECUCION.md marca P00 como completado y agrega su sección en la bitácora.
- Muéstrame un resumen breve de lo encontrado y cualquier riesgo para los siguientes prompts.
````

**Verificación del estudiante:** abrir `doc/ESTADO_ACTUAL.md` y confirmar que la sección 5 describe el login real y que la sección 8 dice si existe `DATABASE_URL`. Si no existe, agregarla antes de P01.

**Commit sugerido:** `docs: auditoría del repositorio y archivos de control para Copilot`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea:** tres migraciones, `scripts/verificar-bd.mjs` y, si hace falta, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 7 y 13), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: crear y aplicar las tres migraciones del módulo y dejar un script de verificación de la base de datos.

TAREA 1. Crea en supabase/migrations/ tres archivos con los nombres definidos en la sección 12 de ESTADO_ACTUAL.md:
- Migración M1 (tablas) con el SQL exacto de la sección 7.2 del plan.
- Migración M2 (vista y seguridad) con el SQL exacto de la sección 7.3.
- Migración M3 (calendario de demostración) con el SQL exacto de la sección 7.4.
No cambies nombres de tablas, columnas ni restricciones: el código posterior depende de ellos (sección 7.5).

TAREA 2. Aplica las migraciones:
- Si ESTADO_ACTUAL.md indica un mecanismo de migraciones existente, úsalo y explica en la bitácora cómo lo ejecutaste.
- Si no existe:
  a) Instala pg y @types/pg si faltan.
  b) Crea scripts/migrar.mjs que: lea DATABASE_URL de process.env; se conecte con ssl { rejectUnauthorized: false }; cree la tabla _migrations (id serial primary key, archivo text unique not null, aplicada_en timestamptz default now()) si no existe; recorra supabase/migrations/*.sql en orden alfabético; aplique dentro de una transacción cada archivo no registrado y lo registre; imprima "aplicada: archivo" u "omitida: archivo"; termine con código 1 si algo falla.
  c) Si hay migraciones anteriores del login que ya se aplicaron por otro medio (las tablas ya existen), regístralas en _migrations sin ejecutarlas, antes de aplicar las nuevas, y explícalo en la bitácora.
  d) Agrega a package.json el script "db:migrar": "node --env-file=.env.local scripts/migrar.mjs" y ejecútalo.

TAREA 3. Crea scripts/verificar-bd.mjs y el script "db:verificar": "node --env-file=.env.local scripts/verificar-bd.mjs". Debe imprimir:
1. Existencia (sí/no) de calendario_renta, clientes, citas, pagos, revisiones, eventos_cliente y de la vista v_clientes_fecha.
2. Número de filas de cada tabla.
3. Restricciones de citas y pagos (pg_constraint) e índices únicos parciales (pg_indexes), confirmando que existen citas_sin_cruce, ux_citas_una_activa_por_cliente, ux_pagos_consulta_confirmado y ux_pagos_servicio_confirmado.
4. Si RLS está activo en las seis tablas (pg_class.relrowsecurity).
5. Las filas del calendario de demostración.
6. Prueba de la Regla 2 dentro de una transacción que SIEMPRE termina en ROLLBACK: insertar tres clientes de prueba válidos (cédulas 9999999991, 9999999992, 9999999993, teléfonos móviles válidos, aceptación de datos true, origen 'contador'); una cita del primero a '2030-01-07 10:00'; intentar una del segundo a '2030-01-07 10:15' (debe fallar con código 23P01; usa un SAVEPOINT para continuar); una del tercero a '2030-01-07 10:30' (debe funcionar). Imprime "Regla 2 · cruce a las 10:15 rechazado: OK" y "Regla 2 · cita a las 10:30 permitida: OK", o FALLA con el detalle.
7. Prueba de la Regla 8 en la misma transacción: una segunda cita agendada del tercer cliente a '2030-01-07 15:00' debe fallar con 23505 en ux_citas_una_activa_por_cliente. Imprime OK o FALLA.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques archivos del login ni de app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida completa de npm run db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase, sección Table Editor, deben aparecer las seis tablas nuevas y `calendario_renta` debe tener 5 filas de demostración. La salida de `npm run db:verificar` no debe tener ninguna línea con FALLA.

**Commit sugerido:** `feat(bd): tablas, vista y calendario de demostración del módulo`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/negocio.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 4, 5, 8.3, 8.4, 8.5, 9.2, 12 y 14.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas de negocio como funciones puras y probarlas con Vitest. Este es el núcleo lógico del proyecto: cada regla del plan funcional queda en una función que se puede probar sin base de datos.

TAREA 1. Instala vitest como dependencia de desarrollo. Agrega a package.json "test": "vitest run" y "test:ver": "vitest". Crea vitest.config.ts con environment 'node', include ['tests/**/*.test.ts'] y el mismo alias '@' de tsconfig.json.

TAREA 2. Crea lib/config/negocio.ts con el contenido exacto de la sección 8.4.

TAREA 3. Crea los archivos de lib/reglas/ con las firmas exactas de la sección 8.5:
- errores.ts: tipo CodigoError; MENSAJES y ESTADO_HTTP con los valores de la tabla 9.2; clase ErrorDeNegocio (name = 'ErrorDeNegocio'; si no recibe mensaje usa MENSAJES[codigo]).
- fechas.ts: ahoraBogota usando Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) con formatToParts. diaSemanaISO, sumarDias y diasEntre con Date.UTC (sección 12). estadoFechaLimite según RN-07.
- estados.ts: ETIQUETA_ESTADO (tabla 4.2), TRANSICIONES (tabla 4.3), siguienteEstado (lanza ACCION_NO_PERMITIDA_EN_ESTADO si la combinación no existe), accionesPermitidas (tabla 4.4, en el orden de la tabla), puedeIniciarTramite (RN-06).
- pagos.ts: valorEsperado; evaluarMonto (RN-01 y RN-05); validarRegistroPago:
  · primera_consulta: estado del cliente cita_agendada y cita con estadoCita 'agendada' y estadoPago 'pendiente'; si no, ACCION_NO_PERMITIDA_EN_ESTADO.
  · servicio_completo: estado debe_declarar; si no, PAGO_SERVICIO_NO_DISPONIBLE.
  · existeConfirmado true: PAGO_YA_CONFIRMADO.
  validarResolucionPago: aprobar solo si el pago está en requiere_revision; anular solo si está en pendiente o requiere_revision; en otro caso PAGO_NO_MODIFICABLE; observación recortada con menos de LONGITUD_MINIMA_OBSERVACION caracteres: OBSERVACION_REQUERIDA.
- agenda.ts: seCruzan (intervalo semiabierto: a.inicio < b.fin && b.inicio < a.fin), estaDentroDelHorario, validarNuevaCita (orden exacto de validaciones de la sección 8.5), calcularHorariosDisponibles (pasos de 30 minutos desde el inicio de cada bloque).
- revisiones.ts: validarRegistroRevision (estado distinto de consulta_pagada: ACCION_NO_PERMITIDA_EN_ESTADO; citaPagada false: PAGO_CONSULTA_REQUERIDO; existeRevision true: REVISION_EXISTENTE). validarCorreccionRevision (RN-18; si el resultado nuevo es igual al actual: DATOS_INVALIDOS; devuelve el evento CORRECCION_A_DEBE_DECLARAR o CORRECCION_A_NO_DEBE_DECLARAR).
- calendario.ts: dosUltimosDigitos, buscarFechaEnCalendario (usa solo los rangos del año gravable mayor presente), rangosSeSolapan (mismo año y rangos que comparten al menos un dígito), validarNuevoRango (RANGO_INVALIDO si desde > hasta o fuera de 0 a 99; RANGO_SOLAPADO si se solapa con un existente).
- privacidad.ts: enmascararCC (asteriscos en todos los dígitos menos los últimos 4) y coincidenUltimos4.

Ningún archivo de lib/reglas/ importa pg, next ni process.env, ni llama new Date() (la única excepción es el valor por defecto del parámetro de ahoraBogota).

TAREA 4. Crea las pruebas en tests/reglas/, un archivo por módulo de reglas, cubriendo TODAS las filas T-01 a T-36 de la sección 14.1. Cada caso lleva el ID en su nombre, por ejemplo: it('T-10 rechaza una cita a las 10:15 si existe una a las 10:00', ...). Crea tests/reglas/ayudas.ts con una función esperarCodigo(fn, codigo) que ejecute fn, capture el error y verifique que sea ErrorDeNegocio con ese código (falla si no se lanzó error).

TAREA 5. Ejecuta npm test hasta que las 36 pruebas pasen. Si una prueba falla, corrige la regla, no la prueba, salvo que la prueba contradiga el plan; en ese caso explícalo en la bitácora.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida resumida de npm test (número de pruebas y archivos).
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ejecutar `npm test` en la terminal. Debe mostrar 36 pruebas pasadas. Leer `lib/reglas/pagos.ts` y ubicar dónde se aplica la Regla 1 del plan funcional.

**Commit sugerido:** `feat(reglas): reglas de negocio puras con 36 pruebas unitarias`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión del contador, respuestas HTTP, esquemas, formato y `/api/contador/sesion` · **Modifica:** archivo de protección de rutas y la redirección del login

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 1.3, 7.5, 8.1, 8.3, 8.7, 9.1, 9.2, 9.5, 11 y 13), doc/ESTADO_ACTUAL.md (en especial la sección 5, Autenticación) y doc/ESTADO_EJECUCION.md.

OBJETIVO: dejar lista la infraestructura que usarán todas las rutas: conexión a Postgres con transacciones, sesión del contador, formato de respuestas, esquemas de validación y utilidades de formato.

TAREA 1. lib/db/conexion.ts exactamente como la sección 8.7, implementando consultar (pool.query y devolver rows) y conTransaccion (BEGIN, trabajo, COMMIT; ROLLBACK y relanzar en error; release siempre). Si ESTADO_ACTUAL.md reporta un pool de pg existente, no lo dupliques: reutilízalo agregando los parsers de tipo y explícalo en la bitácora.

TAREA 2. lib/auth/sesionContador.ts:
- obtenerContador(): Promise<{ id: string; nombre: string; correo: string } | null>, usando el mecanismo de sesión del login existente descrito en ESTADO_ACTUAL.md. Si existen roles, solo devuelve el usuario si tiene rol de administrador o contador; si no hay roles, cualquier usuario autenticado es el contador.
- exigirContador(): igual que obtenerContador, pero lanza ErrorDeNegocio('NO_AUTORIZADO') si no hay sesión válida.
- Solo importa funciones del login; no modifica sus archivos.

TAREA 3. Protección de rutas. En el archivo de protección indicado en ESTADO_ACTUAL.md (proxy.ts o middleware.ts) agrega /contador/:path* y /api/contador/:path* al matcher, conservando lo que ya protege. Sin sesión: las páginas redirigen a la ruta del login y las rutas /api/contador responden 401 con el formato de la sección 9.1. Si el archivo no existe, créalo con esa única responsabilidad usando una verificación de sesión compatible con su runtime. Si la verificación no es posible en ese archivo, deja la protección en el layout del panel (P09) y en exigirContador(), y anótalo en la bitácora.

TAREA 4. Cambia SOLO el destino de la redirección posterior al login para que sea /contador (archivo y línea indicados en ESTADO_ACTUAL.md). Si la ruta anterior la usan otras partes del proyecto, déjala funcionando.

TAREA 5. lib/http/respuestas.ts:
- responderOk(datos, estado = 200): { ok: true, datos }.
- responderError(error: unknown):
  · ErrorDeNegocio: estado ESTADO_HTTP[codigo] y { ok: false, error: { codigo, mensaje, detalles } }.
  · ZodError: 400 DATOS_INVALIDOS con detalles = error.flatten().
  · Error de pg con code 23505, 23P01 o 23514: traducir con la tabla de la sección 7.5 usando error.constraint.
  · Cualquier otro: console.error con el error completo y 500 ERROR_INTERNO sin detalles.
- conManejoDeErrores(handler): envuelve un route handler con try/catch y responderError.
- leerCuerpo(request, esquema): request.json() (si falla, DATOS_INVALIDOS) y esquema.parse.
- Todas las respuestas llevan el header Cache-Control: no-store.

TAREA 6. lib/validacion/esquemas.ts con todos los esquemas de la sección 9.5, exportando también sus tipos (z.infer). Mensajes de validación en español. Los esquemas se usan en el servidor y en los formularios del navegador, así que este archivo no importa nada del servidor.

TAREA 7. lib/formato.ts: formatearPesos(50000) → "$ 50.000"; formatearFechaLarga('2026-08-15') → "15 de agosto de 2026" (Intl con timeZone 'UTC' sobre la fecha); formatearHora('14:30') → "2:30 p. m."; textoDiasRestantes(estado, dias) → "Faltan 10 días", "Falta 1 día", "Vence hoy", "Venció hace 3 días", "Sin fecha registrada".

TAREA 8. app/api/contador/sesion/route.ts: GET envuelto en conManejoDeErrores; primera instrucción await exigirContador(); responde { nombre, correo }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Luego inicia npm run dev y comprueba GET /api/contador/sesion sin sesión (debe dar 401). Si no puedes iniciar sesión tú mismo, pídeme que inicie sesión en el navegador y abra http://localhost:3000/api/contador/sesion, y espera mi confirmación de que responde 200 con el nombre. Comprueba también que el login sigue funcionando y que ahora redirige a /contador (puede mostrar 404 hasta P09).

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados de la verificación.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora (incluye el diff resumido de los archivos del login o de protección que tocaste).
- Muéstrame un resumen.
````

**Verificación del estudiante:** iniciar sesión en el navegador: debe llevar a `/contador` (por ahora una página 404). Abrir `http://localhost:3000/api/contador/sesion` con sesión: debe mostrar el nombre. En una ventana privada debe mostrar el error 401.

**Commit sugerido:** `feat(servidor): conexión con transacciones, sesión del contador y utilidades de API`

---

## P04 · Datos: clientes, calendario y agenda

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/tipos.ts`, `eventos.ts`, `calendario.ts`, `clientes.ts`, `citas.ts`, `lib/dataService.ts`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 4, 5, 6, 7.5, 8.5, 8.6, 12 y 13), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa también lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: implementar el acceso a datos y los casos de uso de clientes, calendario tributario y agenda, con transacciones.

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 8.6: DatosRegistroCliente, ClienteBasico, FilaCliente, DetalleCliente, CambiosCliente, ResultadoFechaLimite, FilaCalendario, CitaResumen, FilaCita, DatosPago, FilaPago, ResumenPanel. Reutiliza los tipos de lib/reglas y de lib/validacion en lugar de duplicarlos.

TAREA 2. lib/datos/eventos.ts con funciones internas reutilizables:
- registrarEvento(tx, { clienteId, tipo, anterior, nuevo, actor, detalle }).
- bloquearCliente(tx, clienteId): SELECT id, cc, estado FROM clientes WHERE id = $1 FOR UPDATE; si no existe, CLIENTE_NO_ENCONTRADO.
- actualizarEstadoCliente(tx, clienteId, estado).

TAREA 3. lib/datos/calendario.ts:
- obtenerRangosCalendario() (interna).
- listarCalendario(): ordenado por año descendente y dígito desde.
- agregarRangoCalendario(r): lee los rangos del mismo año, aplica validarNuevoRango e inserta.
- eliminarRangoCalendario(id).
- eliminarCalendarioDemo(): borra las filas con es_demo = true y devuelve cuántas borró.

TAREA 4. lib/datos/clientes.ts:
- registrarCliente(d, origen): inserta en transacción junto con el evento CLIENTE_REGISTRADO (actor igual al origen). La cédula duplicada se traduce por la restricción clientes_cc_unica.
- verificarCliente(cc, ultimos4): busca por cc; si no existe o coincidenUltimos4 es falso, DATOS_NO_COINCIDEN (el mismo error en ambos casos).
- consultarFechaLimite(cc): lee de v_clientes_fecha; si no existe, CLIENTE_NO_ENCONTRADO; calcula estadoFechaLimite con ahoraBogota().fecha y fecha_limite_efectiva.
- listarClientes({ busqueda, estado }): desde v_clientes_fecha; la búsqueda compara lower(nombre) LIKE y cc LIKE; orden por nombre; devuelve ccEnmascarada (nunca la cédula completa), estadoFecha y diasRestantes.
- obtenerDetalleCliente(id): cliente desde v_clientes_fecha; citas con to_char para fecha (YYYY-MM-DD), hora y horaFin (HH24:MI), ordenadas por inicio descendente; pagos; revisión; eventos del más reciente al más antiguo; acciones = accionesPermitidas(estado); puedeIniciarTramite calculado con la revisión y la existencia de pago de servicio confirmado.
- actualizarCliente(id, cambios): en transacción con bloqueo; actualiza solo los campos enviados (fechaLimiteManual null borra la fecha manual); evento DATOS_ACTUALIZADOS con la lista de campos cambiados, sin sus valores.

TAREA 5. lib/datos/citas.ts:
- obtenerHorariosDisponibles(fecha, origen): lee las citas no canceladas de esa fecha (to_char HH24:MI de inicio y fin) y aplica calcularHorariosDisponibles con ahoraBogota().
- agendarCita({ clienteId, fecha, hora, origen }): secuencia de la sección 6.2. Si el estado es cita_agendada: CITA_ACTIVA_EXISTENTE; cualquier otro estado distinto de registrado: ACCION_NO_PERMITIDA_EN_ESTADO. validarNuevaCita con las ocupadas del día. Inserta con valor = TARIFA_PRIMERA_CONSULTA, origen e inicio = ($fecha || ' ' || $hora || ':00')::timestamp. siguienteEstado(estado, 'AGENDAR_CITA'). Evento CITA_AGENDADA con { citaId, fecha, hora }; actor igual al origen.
- reprogramarCita(citaId, fecha, hora): bloquea al cliente de la cita; la cita debe estar 'agendada' (si no, CITA_NO_MODIFICABLE); validarNuevaCita con las ocupadas del día excluyendo la propia cita; actualiza inicio; evento CITA_REPROGRAMADA con fecha y hora anteriores y nuevas; no cambia el estado del trámite.
- cancelarCita(citaId, motivo, actor): RN-15. Si la cita no está 'agendada': CITA_NO_MODIFICABLE. Si existe un pago de la cita en 'confirmado' o 'requiere_revision': CITA_CON_PAGO. Los pagos 'pendiente' de la cita pasan a 'anulado' con observación "Anulado por cancelación de la cita" y un evento PAGO_ANULADO con actor 'sistema' por cada uno. La cita pasa a 'cancelada' con el motivo. siguienteEstado(estado, 'CANCELAR_CITA'). Evento CITA_CANCELADA.
- obtenerCitaActiva(clienteId): cita 'agendada' del cliente o null.
- listarCitas(desde, hasta): citas no canceladas del rango con nombre e id del cliente, ordenadas por inicio.
Cita inexistente: CITA_NO_ENCONTRADA.

TAREA 6. lib/dataService.ts como fachada: reexporta las funciones públicas de clientes, calendario y citas, y los tipos de lib/datos/tipos.ts. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

RESTRICCIONES: SQL siempre con parámetros. No crear rutas ni pantallas. No modificar lib/reglas salvo un error demostrado (en ese caso, agregar la prueba correspondiente).

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega su sección en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run build` y `npm test` terminan sin errores. Abrir `lib/datos/citas.ts` y ubicar en `agendarCita` los pasos de la sección 6.2 del plan.

**Commit sugerido:** `feat(datos): clientes, calendario y agenda con transacciones`

---

## P05 · Datos: pagos, revisión, trámite y prueba de flujo

**Fase:** 4 (cierre) · **Crea:** `lib/datos/pagos.ts`, `revisiones.ts`, `tramite.ts`, `resumen.ts`, `scripts/probar-flujo.ts`, `scripts/limpiar-cliente.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 4, 5, 6 con CU-07 a CU-12 y CU-15, 8.6 y 14.2), doc/ESTADO_EJECUCION.md y los archivos de lib/datos/ creados en P04.

OBJETIVO: completar los casos de uso de pagos, revisión e inicio del trámite, y comprobar el flujo completo contra la base de datos real.

TAREA 1. lib/datos/pagos.ts:
- registrarPago(d): implementación de la sección 6.2 (ejemplo de CU-07). Para servicio_completo la cita es null. Para primera_consulta verifica que la cita pertenezca al cliente (si no, DATOS_INVALIDOS). Evento PAGO_REGISTRADO con { pagoId, tipo, monto, estado }.
- aprobarPago(pagoId, observacion): bloquea al cliente del pago; validarResolucionPago con 'aprobar'; calcula siguienteEstado con CONFIRMAR_PAGO_CONSULTA o CONFIRMAR_PAGO_SERVICIO (falla si el estado actual no lo permite); marca el pago 'confirmado' y guarda la observación; si es de consulta marca la cita como 'pagada'; actualiza el estado; evento PAGO_APROBADO.
- anularPago(pagoId, observacion): validarResolucionPago con 'anular'; marca 'anulado' con la observación; evento PAGO_ANULADO. No cambia el estado del trámite.
- listarPagosEnRevision(): pagos en 'requiere_revision' con nombre e id del cliente y diferencia = monto - valor_esperado.
Pago inexistente: PAGO_NO_ENCONTRADO.

TAREA 2. lib/datos/revisiones.ts:
- registrarRevision({ citaId, resultado, observaciones }): bloquea al cliente de la cita; citaPagada es verdadero solo si cita.estado_pago = 'pagada' y existe un pago 'confirmado' de esa cita; validarRegistroRevision; inserta con fecha_revision = ahoraBogota().fecha; la cita pasa a 'atendida'; siguienteEstado con REVISION_DEBE_DECLARAR o REVISION_NO_DEBE_DECLARAR; evento REVISION_REGISTRADA.
- corregirRevision(revisionId, resultado, motivo): bloquea al cliente; cuenta los pagos de servicio con estado distinto de 'anulado'; validarCorreccionRevision devuelve el evento; actualiza el resultado; siguienteEstado; evento REVISION_CORREGIDA con resultado anterior, resultado nuevo y motivo.
Revisión inexistente: REVISION_NO_ENCONTRADA.

TAREA 3. lib/datos/tramite.ts: iniciarTramite(clienteId): bloquea; lee la revisión y si existe pago de servicio confirmado; si puedeIniciarTramite es falso, TRAMITE_NO_HABILITADO; siguienteEstado con INICIAR_TRAMITE; evento TRAMITE_INICIADO.

TAREA 4. lib/datos/resumen.ts: obtenerResumen() con el conteo por estado (los siete estados, en cero si no hay clientes), total de clientes, citas de hoy en Bogotá (no canceladas, ordenadas por hora, con nombre e id del cliente) y número de pagos en revisión.

TAREA 5. Completa lib/dataService.ts con las funciones nuevas.

TAREA 6. scripts/limpiar-cliente.mjs: recibe una o varias cédulas como argumentos; en una transacción borra sus registros en el orden eventos_cliente, revisiones, pagos, citas, clientes; imprime cuántas filas borró por tabla. Script "db:limpiar": "node --env-file=.env.local scripts/limpiar-cliente.mjs". Uso: npm run db:limpiar -- 1004567849 1004567890

TAREA 7. Instala tsx como dependencia de desarrollo. Crea scripts/probar-flujo.ts con los 14 pasos de la sección 14.2, usando solo funciones de lib/dataService.ts:
- Para el paso 3 toma el primer día desde mañana que tenga horarios disponibles con obtenerHorariosDisponibles(fecha, 'contador') y usa el primer horario.
- Cada paso imprime "OK    Paso N · descripción" o "FALLA Paso N · descripción · detalle". Los pasos que esperan error verifican el código de ErrorDeNegocio.
- Al final imprime el total de fallas y termina con código 1 si hubo alguna.
- En un bloque finally borra los registros de 9999990001 y 9999990002 (misma lógica de limpieza de la TAREA 6) y cierra el pool.
- Script "probar:flujo": "tsx --env-file=.env.local scripts/probar-flujo.ts". Si tsx no acepta --env-file en esta versión, usa "node --env-file=.env.local --import tsx scripts/probar-flujo.ts".
Ejecuta npm run probar:flujo. Si un paso falla, corrige lib/datos o lib/reglas (nunca el script para que pase) y repite hasta tener 0 fallas.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con la salida completa de npm run probar:flujo.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ejecutar `npm run probar:flujo`. Deben aparecer 14 líneas OK y 0 fallas. En Supabase no deben quedar clientes con cédulas que empiecen por 99999.

**Commit sugerido:** `feat(datos): pagos, revisión, inicio de trámite y prueba de flujo`

---

## P06 · API pública

**Fase:** 5 (primera parte) · **Crea:** seis rutas en `app/api/publico/` y `scripts/probar-api.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 9.1, 9.2, 9.3, 9.5, 13 y 14.3), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts y lib/validacion/esquemas.ts.

OBJETIVO: exponer las operaciones del cliente sin cuenta, protegiendo sus datos personales.

TAREA 1. Crea estas rutas, cada una envuelta en conManejoDeErrores, con leerCuerpo para validar y export const dynamic = 'force-dynamic':
1. app/api/publico/clientes/route.ts · POST: esquemaRegistroCliente; registrarCliente(datos, 'cliente'); 201 con { registrado: true }.
2. app/api/publico/fecha-limite/route.ts · POST: { cc }; consultarFechaLimite(cc).
3. app/api/publico/disponibilidad/route.ts · GET ?fecha=YYYY-MM-DD: obtenerHorariosDisponibles(fecha, 'cliente'); responde { fecha, horarios }.
4. app/api/publico/citas/route.ts · POST: esquemaAgendarPublico; verificarCliente(cc, ultimos4); agendarCita({ clienteId, fecha, hora, origen: 'cliente' }); 201 con { fecha, hora, horaFin, valor, instruccionesPago: INSTRUCCIONES_PAGO }.
5. app/api/publico/mi-cita/route.ts · POST: { cc, ultimos4 }; verificarCliente; obtenerCitaActiva; responde { cita, estadoTramite, etiquetaEstado } donde cita contiene solo fecha, hora, horaFin, valor y estadoPago.
6. app/api/publico/mi-cita/cancelar/route.ts · POST: { cc, ultimos4, motivo? }; verificarCliente; cita activa (si no hay, CITA_NO_ENCONTRADA); cancelarCita(id, motivo o "Cancelada por el cliente", 'cliente'); responde { cancelada: true }.

Ninguna respuesta incluye la cédula, el teléfono, el correo ni el id interno del cliente.

TAREA 2. Crea scripts/probar-api.mjs con los 12 pasos de la sección 14.3:
- Usa fetch contra process.env.BASE_URL o 'http://localhost:3000'.
- Para el paso 6 prueba fechas desde mañana hasta encontrar una con horarios; usa el primer horario en el paso 8.
- Imprime "OK    Paso N · descripción" o "FALLA Paso N · descripción · estado HTTP y cuerpo".
- En un bloque finally borra los registros de la cédula 9999990003 con pg (mismo orden de limpieza que scripts/limpiar-cliente.mjs).
- Termina con código 1 si hubo fallas.
- Script "probar:api": "node --env-file=.env.local scripts/probar-api.mjs".

TAREA 3. Inicia npm run dev en segundo plano, espera a que responda y ejecuta npm run probar:api. Corrige las rutas o la capa de datos hasta tener 0 fallas. Detén el servidor al final. Si no puedes mantener el servidor en segundo plano, pídeme que ejecute npm run dev en otra terminal y espera mi confirmación.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega en la bitácora la salida de npm run probar:api. La fase 5 sigue abierta hasta P07.
- Muéstrame un resumen.
````

**Verificación del estudiante:** con `npm run dev` abierto en una terminal, ejecutar `npm run probar:api` en otra. Deben aparecer 12 líneas OK.

**Commit sugerido:** `feat(api): rutas públicas de registro, fecha límite y citas`

---

## P07 · Componentes base y pantallas públicas

**Fase:** 5 (cierre) · **Crea:** `components/ui/*`, `components/publico/*`, páginas `/registro`, `/consulta`, `/agendar` · **Modifica:** `app/globals.css` y, según el caso, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 10.1, 10.3, 11 y 13), doc/ESTADO_ACTUAL.md (secciones 9 y 11), doc/ESTADO_EJECUCION.md, lib/validacion/esquemas.ts y lib/formato.ts.

OBJETIVO: construir los componentes reutilizables de interfaz y las pantallas del cliente.

TAREA 1. Agrega los tokens de color de la sección 11 sin borrar nada existente: con Tailwind 4 en el bloque @theme de app/globals.css; con Tailwind 3 en tailwind.config.

TAREA 2. components/ui/:
- Boton: variantes primario, secundario, peligro y fantasma; prop cargando que deshabilita y muestra un texto de carga.
- Campo: label asociado, input, texto de ayuda y mensaje de error; acepta todas las props de input.
- Selector: select con label y error.
- Tarjeta.
- Insignia: prop tono (neutro, info, primario, exito, advertencia, peligro).
- Aviso: tonos info, exito, advertencia y error.
- Modal: fondo oscuro, cierre con Escape y con botón, foco en el primer campo al abrir, role="dialog" y aria-modal="true".
- EstadoVacio: título, texto y acción opcional.
Todos con foco visible y contraste suficiente.

TAREA 3. components/publico/:
- EncabezadoPublico y PiePublico (el pie lleva el aviso de la sección 10.3).
- FormularioRegistro, FormularioConsulta y FormularioVerificacion (cédula y últimos cuatro dígitos del teléfono).
- SelectorHorario: recibe una fecha, consulta /api/publico/disponibilidad y muestra las horas como botones; estados de carga y vacío ("No hay horarios disponibles para esta fecha").
- ResumenCita.
Los formularios validan en el navegador con los mismos esquemas Zod y muestran error.mensaje cuando el servidor responde con error.

TAREA 4. Páginas con el comportamiento de la sección 10.1:
- app/registro/page.tsx
- app/consulta/page.tsx
- app/agendar/page.tsx (pasos: verificación; cita activa con opción de cancelar, o selección de fecha y hora; confirmación con INSTRUCCIONES_PAGO).
- app/page.tsx: si es la plantilla de Next.js, reemplázala por el inicio de la sección 10.1; si tiene contenido propio, agrega las tres tarjetas sin borrar lo existente. Incluye un enlace discreto "Acceso del contador" a la ruta del login.

DISEÑO: sobrio y claro, móvil primero, ancho máximo de 640 px en formularios y 960 px en el inicio, sin emojis, textos en español con tratamiento de "usted".

VERIFICACIÓN: con npm run dev, recorre y describe en la bitácora: registrar la cédula 1004567849 con teléfono 3001234567; consultar su fecha límite; agendar una cita; ver la cita; cancelarla; repetir el registro (mensaje de cédula duplicada); verificar con dígitos incorrectos (mensaje de datos que no coinciden). Al final ejecuta npm run db:limpiar -- 1004567849.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md con el recorrido realizado.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en el navegador, recorrer `/`, `/registro`, `/consulta` y `/agendar` en computador y en vista móvil (herramientas de desarrollador). Hacer push y repetir el recorrido en la URL de Vercel.

**Commit sugerido:** `feat(publico): componentes base y pantallas de registro, consulta y agenda`

---

## P08 · API del contador

**Fase:** 6 (primera parte) · **Crea:** rutas de `app/api/contador/`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 9.1, 9.2, 9.4 y 9.5), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts y lib/auth/sesionContador.ts.

OBJETIVO: exponer todas las operaciones del contador.

TAREA 1. Crea todas las rutas de la tabla 9.4 (la de sesion ya existe). Reglas para cada handler:
- Primera instrucción: await exigirContador().
- Envuelto en conManejoDeErrores; cuerpos validados con leerCuerpo y los esquemas de 9.5.
- ids numéricos de la ruta con z.coerce.number().int().positive(); ids de cliente con z.string().uuid(). Siempre const { id } = await params.
- export const dynamic = 'force-dynamic'.
Detalles:
- POST /api/contador/clientes usa registrarCliente(datos, 'contador') y responde 201 con { id }.
- PATCH /api/contador/clientes/[id] usa actualizarCliente.
- GET /api/contador/citas exige desde y hasta (fechas válidas) con máximo 31 días de diferencia; si no, DATOS_INVALIDOS.
- GET /api/contador/pagos solo acepta estado=requiere_revision y usa listarPagosEnRevision.
- POST /api/contador/pagos/[id]/aprobar y /anular reciben { observacion }.
- DELETE /api/contador/calendario/demo usa eliminarCalendarioDemo.

TAREA 2. Verificación: con npm run dev, sin sesión, haz peticiones a GET /api/contador/resumen, GET /api/contador/clientes y POST /api/contador/pagos y confirma 401 en las tres. Documenta los resultados. Las pruebas con sesión se hacen desde el panel en P10 y P11.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en una ventana privada abrir `http://localhost:3000/api/contador/resumen`: debe responder 401. Con sesión iniciada debe responder 200 con los conteos.

**Commit sugerido:** `feat(api): rutas del contador protegidas`

---

## P09 · Panel: estructura, resumen y clientes

**Fase:** 6 · **Crea:** layout del panel, resumen, listado y registro de clientes

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (sección 10.2: layout, resumen, clientes y nuevo; sección 11), doc/ESTADO_ACTUAL.md (sección 5, cierre de sesión), doc/ESTADO_EJECUCION.md y los componentes de components/ui/.

OBJETIVO: construir la estructura del panel del contador, el resumen y la gestión básica de clientes.

TAREA 1. components/contador/NavegacionPanel.tsx: barra lateral en escritorio y cajón en móvil; enlaces Resumen (/contador), Clientes, Agenda, Pagos en revisión y Calendario tributario; enlace activo resaltado; nombre del contador; botón de cerrar sesión que usa el mecanismo existente del login.

TAREA 2. app/contador/layout.tsx: componente de servidor; llama obtenerContador(); sin sesión, redirect a la ruta del login; renderiza la navegación y el contenido con fondo --color-fondo.

TAREA 3. components/contador/InsigniaEstado.tsx e InsigniaFecha.tsx con los tonos de la sección 11 y las etiquetas de ETIQUETA_ESTADO y textoDiasRestantes. components/contador/TarjetaIndicador.tsx (título, valor, enlace opcional).

TAREA 4. app/contador/page.tsx (servidor): obtenerResumen(); cuatro indicadores (clientes totales, citas de hoy, pagos en revisión, trámites en proceso); conteo por estado con las siete insignias, cada una enlazada a /contador/clientes?estado=...; tabla de citas de hoy con hora, cliente (enlace al detalle), estado de la cita y estado del pago; EstadoVacio si no hay citas.

TAREA 5. components/contador/TablaClientes.tsx y app/contador/clientes/page.tsx: buscador que actualiza ?busqueda= en la URL con espera de 300 ms; respeta ?estado= si viene en la URL (el selector visual se agrega en P13); tabla con nombre, cédula enmascarada, teléfono, estado, fecha límite y enlace "Ver"; tarjetas apiladas en pantallas pequeñas; botón "Registrar cliente"; EstadoVacio.

TAREA 6. components/contador/FormularioCliente.tsx (modos crear y editar) y app/contador/clientes/nuevo/page.tsx: en modo crear la casilla dice "El cliente autorizó el tratamiento de sus datos personales"; POST /api/contador/clientes; al guardar redirige a /contador/clientes/[id] (esa página se construye en P10).

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Comprueba: el login lleva al resumen; registrar un cliente de prueba (cédula 9999990010, teléfono 3001112233); verlo en el listado con la cédula enmascarada; buscarlo por nombre y por cédula; filtrar con ?estado=registrado. Al final ejecuta npm run db:limpiar -- 9999990010.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** iniciar sesión, revisar el resumen y registrar un cliente desde el panel. Revisar la navegación en vista móvil.

**Commit sugerido:** `feat(panel): estructura, resumen y gestión de clientes`

---

## P10 · Panel: detalle del cliente y acciones por estado

**Fase:** 6 · **Crea:** detalle del cliente, panel de acciones y formularios de las operaciones del trámite

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 4.4, 5, 6, 9.4 y 10.2: detalle y formularios de los modales), doc/ESTADO_EJECUCION.md, lib/datos/tipos.ts (DetalleCliente) y los componentes de components/ui/ y components/contador/.

OBJETIVO: construir la pantalla central del contador: el detalle del cliente, donde solo aparecen las acciones permitidas por el estado del trámite.

TAREA 1. app/contador/clientes/[id]/page.tsx (servidor): obtenerDetalleCliente(id); si el id no es un uuid válido o el cliente no existe, notFound(). Estructura de la sección 10.2: encabezado, tarjeta de datos, tarjeta "Siguiente paso", tabla de citas, tabla de pagos y tarjeta de revisión.

TAREA 2. components/contador/PanelAcciones.tsx (cliente): recibe el detalle; muestra un botón por cada acción de detalle.acciones en el orden de la tabla 4.4, con etiquetas en español; cada botón abre un Modal con su formulario; tras una respuesta exitosa cierra el modal, muestra un Aviso de éxito y ejecuta router.refresh(); si hay error, muestra error.mensaje dentro del modal sin cerrarlo.

TAREA 3. Formularios de los modales (sección 10.2):
- FormularioPago (tipo primera_consulta o servicio_completo): monto precargado con la tarifa, método, referencia y fecha de pago (hoy en Bogotá con ahoraBogota). Antes de guardar muestra el resultado esperado con evaluarMonto de lib/reglas/pagos.ts: "Se confirmará", "Quedará pendiente" o "Quedará en revisión". Para la consulta usa la cita activa del detalle.
- FormularioRevision: resultado con dos opciones (radio) y observaciones; incluye el texto fijo "El sistema registra la decisión del contador; no la calcula". Usa la cita activa pagada.
- Corregir revisión: resultado opuesto al actual preseleccionado y motivo obligatorio.
- FormularioCita con dos modos que comparten la misma selección de fecha y horas disponibles (/api/contador/disponibilidad), más la opción "Hora manual" (input type="time" con step 300):
  · agendar: cliente ya seleccionado (el del detalle); POST /api/contador/citas.
  · reprogramar: POST /api/contador/citas/[id]/reprogramar.
- Cancelar cita: motivo obligatorio.
- Iniciar trámite: confirmación que lista las dos condiciones de RN-06 indicando si se cumplen; el botón de confirmar solo se habilita si detalle.puedeIniciarTramite.
- Editar datos: FormularioCliente en modo edición (sin cédula) más fecha límite manual con la casilla "Usar calendario" (envía null).

TAREA 4. components/contador/TablaCitasCliente.tsx y TablaPagosCliente.tsx. En la tabla de pagos: botones "Aprobar" y "Anular" para pagos en requiere_revision y "Anular" para pagos pendientes, cada uno con modal de observación obligatoria (mínimo 10 caracteres). Montos con formatearPesos y estados con Insignia.

TAREA 5. Tarjeta de revisión: resultado, observaciones y fecha; si no existe, texto "Sin revisión registrada".

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con un cliente de prueba (cédula 9999990011, teléfono 3004445566) registrado desde el panel, recorre desde su detalle: agendar una cita, pago de 49.000 (pendiente, el estado no cambia), pago de 50.000 (Primera consulta pagada), revisión "Debe declarar", pago de 299.000 (pendiente), pago de 300.000 (Servicio pagado), iniciar trámite (En proceso). En cada estado confirma que solo aparecen las acciones de la tabla 4.4. Documenta el recorrido y ejecuta npm run db:limpiar -- 9999990011.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P10 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** repetir en el navegador el recorrido del prompt con un cliente propio y comprobar que el botón "Iniciar trámite" solo se habilita al final.

**Commit sugerido:** `feat(panel): detalle del cliente con acciones según el estado del trámite`

---

## P11 · Panel: agenda, pagos en revisión y calendario tributario

**Fase:** 6 (cierre) · **Crea:** páginas de agenda, pagos en revisión y calendario

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 4.4, 9.4 y 10.2: agenda, pagos y calendario), doc/ESTADO_EJECUCION.md y los componentes de components/contador/.

OBJETIVO: completar el panel con la agenda diaria, la resolución de pagos en revisión y la carga del calendario tributario.

TAREA 1. components/contador/TablaAgenda.tsx y app/contador/agenda/page.tsx: parámetro ?fecha= (por defecto hoy en Bogotá); botones día anterior, hoy y día siguiente; listarCitas(fecha, fecha); por fila: hora de inicio y fin, cliente (enlace al detalle), estado de la cita, estado del pago y acciones (reprogramar y cancelar solo si está agendada, con los mismos modales de P10).

TAREA 2. Botón "Agendar cita" en la agenda: reutiliza FormularioCita (modo agendar, creado en P10) agregando un paso previo con buscador de clientes en estado registrado (GET /api/contador/clientes?estado=registrado&busqueda=). La fecha del formulario inicia con la fecha que muestra la agenda. Tras agendar, router.refresh().

TAREA 3. components/contador/TablaPagosRevision.tsx y app/contador/pagos/page.tsx: pagos en requiere_revision con cliente (enlace), tipo, monto, valor esperado, diferencia, método y fecha; acciones Aprobar y Anular con modal de observación obligatoria; EstadoVacio si no hay pagos.

TAREA 4. components/contador/TablaCalendario.tsx y app/contador/calendario/page.tsx: aviso si hay filas es_demo con botón "Eliminar datos de demostración" (con confirmación); tabla agrupada por año gravable, con el año vigente primero y marcado "Vigente"; botón eliminar por rango; formulario para agregar rango (año gravable, dígito desde, dígito hasta, fecha límite); texto de ayuda de la sección 10.2.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con clientes de prueba 9999990021 y 9999990022:
- A-04: agendar a 9999990021 a las 10:00 de un día hábil futuro y a 9999990022 a las 10:15 del mismo día con hora manual: debe rechazarse por cruce.
- A-05: agendar a 9999990022 a las 10:30: debe aceptarse.
- A-13: registrar para 9999990022 un pago de consulta de 60.000, verlo en Pagos en revisión, aprobarlo con observación y comprobar que pasa a Primera consulta pagada.
- Calendario: agregar un rango del año 2099 (0 a 49), intentar uno solapado (40 a 60, debe rechazarse), eliminar el rango de 2099.
Documenta y ejecuta npm run db:limpiar -- 9999990021 9999990022.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_6_COMPLETADA.md con el resultado de la verificación.
- Marca P11 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** desde la agenda, agendar dos citas que se crucen 15 minutos y confirmar el rechazo; revisar que el calendario muestra el aviso de datos de demostración.

**Commit sugerido:** `feat(panel): agenda, pagos en revisión y calendario tributario`

---

## P12 · Aceptación y cierre del módulo mínimo

**Fase:** 7 · **Crea:** `doc/ACEPTACION.md` · **Modifica:** `README.md` y lo que requieran las correcciones

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 8.3, 13, 14 y 15) y doc/ESTADO_EJECUCION.md completo.

OBJETIVO: comprobar el criterio de terminado del plan funcional y dejar el módulo mínimo listo para la aceptación en Vercel.

TAREA 1. Ejecuta npm test, npm run probar:flujo y, con npm run dev activo, npm run probar:api. Corrige cualquier falla en el código (no en las pruebas).

TAREA 2. Revisa el código contra la sección 8.3 y la sección 13. Reporta en la bitácora cada incumplimiento encontrado y su corrección:
- Archivos fuera de lib/datos que importan lib/db/conexion.ts o pg.
- Rutas de app/api/contador sin await exigirContador() como primera instrucción.
- Respuestas públicas que incluyan cédula, teléfono, correo o id del cliente.
- Montos con decimales o parseFloat.
- Uso de new Date() para calcular "hoy" fuera de lib/reglas/fechas.ts.
- Textos de interfaz en inglés.
- SQL con valores concatenados.

TAREA 3. Ejecuta npm run db:limpiar -- 1004567849 1004567890 1004567862 1004567805 para dejar libres las cédulas de la sección 14.5.

TAREA 4. Crea doc/ACEPTACION.md con:
- Instrucciones: usar la URL del despliegue en Vercel; ejecutar las filas en orden; para repetir, limpiar con npm run db:limpiar y las cédulas de 14.5.
- Tabla de datos de prueba de la sección 14.5.
- Tabla A-01 a A-18 con columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación. Deja vacías "resultado obtenido", "evidencia" y "observación": las llena el estudiante.

TAREA 5. Actualiza README.md con: descripción breve; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, npm run db:migrar, npm run dev); scripts disponibles con su propósito; estructura de carpetas resumida; tabla corta de las Reglas 1 a 8 del plan funcional con la función o restricción que las aplica; enlace a doc/PLAN_AGENDA_TRIBUTARIA.md.

TAREA 6. Verifica que .env.local esté en .gitignore y que ningún archivo versionado contenga valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md con el resultado de las tres pruebas automáticas y la lista de verificación de la TAREA 2.
- Marca P12 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que la tabla de doc/ACEPTACION.md se ejecuta en el despliegue de Vercel.
````

**Verificación del estudiante:** hacer push, esperar el despliegue y ejecutar en la URL de Vercel las filas A-01 a A-18 de `doc/ACEPTACION.md`, llenando el resultado obtenido y la evidencia (captura o descripción). Hacer commit del archivo diligenciado.

**Commit sugerido:** `docs: aceptación del módulo mínimo y README`

---

## P13 · Opcionales A: filtro por estado, fechas próximas e historial

**Fase:** 8 · **Requisito:** `doc/checkpoints/FASE_7_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (sección 16), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_7_COMPLETADA.md. Si FASE_7_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: agregar tres funcionalidades opcionales del plan funcional sin alterar el módulo mínimo.

TAREA 1. Filtro por estado en /contador/clientes: Selector con "Todos" y los siete estados (ETIQUETA_ESTADO) que actualiza ?estado= en la URL y se combina con la búsqueda.

TAREA 2. Fechas próximas en el resumen:
- En lib/datos/resumen.ts agrega a obtenerResumen la lista fechasProximas: clientes cuya fecha_limite_efectiva está entre hoy (Bogotá) y hoy + 15 días, excluyendo estados no_debe_declarar y en_proceso, ordenados por fecha. Agrega DIAS_ALERTA_FECHA_PROXIMA = 15 en lib/config/negocio.ts y el campo al tipo ResumenPanel.
- En app/contador/page.tsx agrega la tarjeta "Fechas límite próximas" con nombre (enlace), estado, fecha e InsigniaFecha.

TAREA 3. Historial en el detalle del cliente:
- components/contador/LineaDeTiempo.tsx que recibe detalle.eventos y muestra, del más reciente al más antiguo: fecha y hora en Bogotá, descripción legible por tipo de evento (por ejemplo, PAGO_REGISTRADO → "Pago de primera consulta registrado por $ 50.000: confirmado"), cambio de estado cuando exista y actor.
- Crea en lib/formato.ts la función describirEvento(evento) con una descripción para cada tipo usado en lib/datos.
- Agrega la línea de tiempo al final del detalle.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P13 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** filtrar clientes por estado, revisar la tarjeta de fechas próximas con el calendario de demostración y revisar el historial de un cliente que haya recorrido el flujo completo.

**Commit sugerido:** `feat(opcional): filtro por estado, fechas próximas e historial del cliente`

---

## P14 · Opcionales B: vista semanal, notas y correo de confirmación

**Fase:** 8 (cierre) · **Requisito:** P13 completado · **Variable nueva:** `RESEND_API_KEY`

````text
Antes de escribir código lee completos: doc/PLAN_AGENDA_TRIBUTARIA.md (secciones 7, 12 y 16), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: agregar la vista semanal de la agenda, las notas del contador y el correo de confirmación de cita.

TAREA 1. Vista semanal en /contador/agenda:
- Parámetro ?vista=dia|semana (por defecto dia) con botones para alternar.
- Vista semana: columnas de lunes a viernes de la semana que contiene ?fecha=, filas cada 30 minutos según HORARIO_ATENCION; cada cita ocupa su celda con nombre del cliente y estado de pago, y enlaza al detalle. Navegación semana anterior y siguiente.
- Usa listarCitas con el rango de la semana.

TAREA 2. Notas del contador:
- Nueva migración (siguiente número) con:
  CREATE TABLE IF NOT EXISTS notas_cliente (id BIGSERIAL PRIMARY KEY, cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE, texto TEXT NOT NULL CHECK (char_length(btrim(texto)) BETWEEN 3 AND 2000), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  CREATE INDEX IF NOT EXISTS idx_notas_cliente ON notas_cliente (cliente_id, created_at DESC);
  ALTER TABLE notas_cliente ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON notas_cliente FROM anon, authenticated;
  Aplícala con npm run db:migrar (o el mecanismo existente).
- lib/datos/notas.ts: listarNotas(clienteId) y agregarNota(clienteId, texto) con evento NOTA_AGREGADA; reexportar en lib/dataService.ts; agregar las notas a obtenerDetalleCliente.
- Rutas GET y POST /api/contador/clientes/[id]/notas con exigirContador.
- En el detalle: tarjeta "Notas" con lista y formulario. Actualiza scripts/limpiar-cliente.mjs para borrar también notas_cliente.

TAREA 3. Correo de confirmación de cita con Resend:
- Instala resend. Crea lib/correo.ts con enviarConfirmacionCita({ correo, nombre, fecha, hora, valor }) que envía un correo en español con fecha legible, hora, valor e INSTRUCCIONES_PAGO. Remitente desde la variable CORREO_REMITENTE o, si no existe, 'onboarding@resend.dev'.
- Si RESEND_API_KEY no está definida, la función no hace nada y registra un aviso en consola.
- Llama a enviarConfirmacionCita DESPUÉS de que agendarCita confirme la transacción (en las rutas POST /api/publico/citas y POST /api/contador/citas). Si el envío falla, la cita se conserva, el error se registra con console.error y la respuesta sigue siendo exitosa.
- Explícame al final: dónde crear la API key en Resend, que debe agregarse a .env.local y a Vercel, y que sin un dominio verificado Resend solo entrega correos a la dirección con la que se creó la cuenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_8_COMPLETADA.md.
- Marca P14 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** alternar entre vista de día y de semana; agregar una nota a un cliente; con `RESEND_API_KEY` configurada, agendar una cita para un cliente con el correo de la cuenta de Resend y confirmar la llegada del correo.

**Commit sugerido:** `feat(opcional): vista semanal, notas del contador y correo de confirmación`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/PLAN_AGENDA_TRIBUTARIA.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora de ESTADO_EJECUCION.md la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/PLAN_AGENDA_TRIBUTARIA.md y doc/PROMPTS_AGENDA_TRIBUTARIA.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel, diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````
