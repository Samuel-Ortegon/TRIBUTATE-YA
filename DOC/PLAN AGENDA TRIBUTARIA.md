# Agenda Tributaria para Contador · Plan técnico de implementación

> Versión técnica 2.0, derivada del plan funcional de Ortegón (segunda versión)
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres + Zod · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_AGENDA_TRIBUTARIA.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida](#1-punto-de-partida)
2. [Alcance](#2-alcance)
3. [Actores y acceso](#3-actores-y-acceso)
4. [Flujo y estados del trámite](#4-flujo-y-estados-del-trámite)
5. [Reglas de negocio](#5-reglas-de-negocio)
6. [Casos de uso](#6-casos-de-uso)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Arquitectura del código](#8-arquitectura-del-código)
9. [Contratos de API](#9-contratos-de-api)
10. [Pantallas](#10-pantallas)
11. [Identidad visual](#11-identidad-visual)
12. [Fechas, horas y zona horaria](#12-fechas-horas-y-zona-horaria)
13. [Seguridad y datos personales](#13-seguridad-y-datos-personales)
14. [Pruebas](#14-pruebas)
15. [Plan de ejecución](#15-plan-de-ejecución)
16. [Funcionalidades opcionales](#16-funcionalidades-opcionales)
17. [Glosario](#17-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_AGENDA_TRIBUTARIA.md` | Este documento |
| `doc/PROMPTS_AGENDA_TRIBUTARIA.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt (lo actualiza cada prompt) |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida

### 1.1 Lo que ya existe y no se reconstruye

- Proyecto Next.js con TypeScript desplegado en Vercel.
- Proyecto Supabase conectado al despliegue.
- Login del contador funcionando.
- Variables de entorno en `.env.local` (local) y en el proyecto de Vercel (producción).

### 1.2 Lo que se verifica en P00 antes de escribir código

| Aspecto | Por qué importa |
|---|---|
| Mecanismo del login (JWT propio en cookie, Supabase Auth u otro) | El adaptador `lib/auth/sesionContador.ts` debe envolverlo sin reescribirlo |
| Ruta a la que redirige el login | Se cambia a `/contador` |
| Archivo de middleware existente | En Next.js 16 se llama `proxy.ts`; en versiones anteriores, `middleware.ts` |
| Variable `DATABASE_URL` | Las operaciones con reglas de negocio usan transacciones con `pg` |
| Mecanismo de migraciones existente | Las tablas nuevas se aplican con ese mecanismo; si no existe, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 11) |
| Rutas `/contador` o `/api/contador` | No deben existir antes; si existen, se reporta el conflicto |

### 1.3 Regla sobre el login

El login existente no se reescribe. Solo se agrega:

1. Un adaptador `lib/auth/sesionContador.ts` que expone `obtenerContador()` y `exigirContador()` usando el mecanismo que ya existe.
2. Protección de las rutas `/contador/*` y `/api/contador/*`.
3. La redirección posterior al login hacia `/contador`.

---

## 2. Alcance

### 2.1 Módulo mínimo

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Registrar cliente | CU-01 | P04, P06, P07, P09 |
| F2 | Consultar fecha límite por cédula | CU-02, CU-13 | P04, P06, P07, P11 |
| F3 | Agendar primera cita de 30 minutos | CU-03, CU-04, CU-05, CU-06 | P04, P06, P07, P11 |
| F4 | Registrar pago de primera consulta ($50.000) | CU-07, CU-08 | P05, P08, P10 |
| F5 | Registrar resultado de la revisión | CU-09, CU-10 | P05, P08, P10 |
| F6 | Registrar pago del servicio completo ($300.000) | CU-11 | P05, P08, P10 |
| F7 | Controlar el estado del trámite | CU-12, CU-15 | P02, P05, P10 |

### 2.2 Fuera de alcance

Se mantiene la lista del plan funcional: cálculo automático de la obligación de declarar, presentación ante la DIAN, formularios tributarios, cálculo del impuesto, procesamiento real de pagos, integración bancaria, videollamadas, aplicación móvil, múltiples contadores y notificaciones por WhatsApp. El sistema registra pagos como información de control; no mueve dinero.

### 2.3 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Un ciclo de trámite por cliente (una revisión por cliente) | El plan funcional guarda el estado en el cliente; varios ciclos anuales quedan para una versión posterior |
| Sin abonos: cada pago se evalúa por su monto individual | Las Reglas 1 y 5 evalúan un pago, no una suma de pagos |
| La fecha límite sale del calendario tributario que carga el contador, según los dos últimos dígitos de la cédula; el contador puede fijar una fecha manual por cliente | La DIAN asigna los vencimientos de personas naturales por los últimos dígitos del NIT; evita digitar la fecha cliente por cliente |
| El cliente se identifica internamente con UUID; la cédula es única pero no viaja en URLs | Sección 12 del plan funcional: la cédula no se expone innecesariamente |
| Para ver, agendar, reprogramar o cancelar su cita, el cliente se verifica con cédula y últimos cuatro dígitos del teléfono | Evita que una persona con una cédula ajena gestione sus citas |
| Reprogramar conserva el pago; cancelar solo procede sin pago confirmado ni pago en revisión | Un cliente que ya pagó no debe perder el pago por cambiar la hora |
| La revisión se puede corregir antes de que exista un pago del servicio no anulado, con motivo obligatorio | Sección 12 del plan funcional: la revisión solo se modifica mediante una operación con reglas |
| Horario de atención fijo en configuración: lunes a viernes de 08:00 a 12:00 y de 14:00 a 18:00 | El plan funcional no define horario; festivos y bloqueos de agenda quedan fuera de esta versión |
| Un pago confirmado no se anula en esta versión | Anularlo exigiría revertir estados del trámite |

---

## 3. Actores y acceso

| Actor | Acceso | Puede hacer |
|---|---|---|
| Cliente | Público, sin cuenta | Registrarse, consultar su fecha límite, ver disponibilidad, agendar, ver y cancelar su cita (con verificación) |
| Contador | Login existente | Todo lo anterior sobre cualquier cliente, más pagos, revisiones, inicio de trámite, calendario tributario y edición de datos |
| Sistema | Interno | Calcula estados de fecha, valida reglas, registra eventos, anula pagos pendientes al cancelar una cita |

| Ruta | Cliente | Contador |
|---|:-:|:-:|
| `/`, `/registro`, `/consulta`, `/agendar` | Sí | Sí |
| `/api/publico/*` | Sí | Sí |
| `/contador/*` | No | Sí |
| `/api/contador/*` | No | Sí |

---

## 4. Flujo y estados del trámite

### 4.1 Diagrama

```text
registrado
    │ AGENDAR_CITA
    ▼
cita_agendada ──── CANCELAR_CITA ───► registrado
    │ CONFIRMAR_PAGO_CONSULTA
    ▼
consulta_pagada
    │ REVISION_DEBE_DECLARAR        │ REVISION_NO_DEBE_DECLARAR
    ▼                               ▼
debe_declarar ◄── correcciones ──► no_debe_declarar (proceso cerrado)
    │ CONFIRMAR_PAGO_SERVICIO
    ▼
servicio_pagado
    │ INICIAR_TRAMITE
    ▼
en_proceso
```

### 4.2 Estados del trámite (columna `clientes.estado`)

| Código | Etiqueta en pantalla | Significado |
|---|---|---|
| `registrado` | Registrado | Cliente creado, sin cita activa |
| `cita_agendada` | Cita agendada | Tiene una cita activa sin pago confirmado |
| `consulta_pagada` | Primera consulta pagada | El pago de $50.000 está confirmado |
| `debe_declarar` | Debe declarar | El contador registró que debe declarar |
| `no_debe_declarar` | No debe declarar (cerrado) | El contador registró que no debe declarar; el proceso termina |
| `servicio_pagado` | Servicio pagado | El pago de $300.000 está confirmado; el trámite puede iniciar |
| `en_proceso` | En proceso | El contador inició el trabajo de la declaración |

### 4.3 Transiciones

| Evento | Estado origen | Estado destino | Lo dispara |
|---|---|---|---|
| `AGENDAR_CITA` | `registrado` | `cita_agendada` | CU-04 |
| `CANCELAR_CITA` | `cita_agendada` | `registrado` | CU-06 |
| `CONFIRMAR_PAGO_CONSULTA` | `cita_agendada` | `consulta_pagada` | CU-07 (monto exacto) o CU-08 (aprobación) |
| `REVISION_DEBE_DECLARAR` | `consulta_pagada` | `debe_declarar` | CU-09 |
| `REVISION_NO_DEBE_DECLARAR` | `consulta_pagada` | `no_debe_declarar` | CU-09 |
| `CORRECCION_A_DEBE_DECLARAR` | `no_debe_declarar` | `debe_declarar` | CU-10 |
| `CORRECCION_A_NO_DEBE_DECLARAR` | `debe_declarar` | `no_debe_declarar` | CU-10 |
| `CONFIRMAR_PAGO_SERVICIO` | `debe_declarar` | `servicio_pagado` | CU-11 (monto exacto) o CU-08 (aprobación) |
| `INICIAR_TRAMITE` | `servicio_pagado` | `en_proceso` | CU-12 |

Cualquier combinación de evento y estado que no aparezca en esta tabla produce el error `ACCION_NO_PERMITIDA_EN_ESTADO`. Reprogramar una cita no cambia el estado del trámite.

### 4.4 Matriz de acciones del contador por estado

El panel muestra únicamente las acciones de esta matriz. El servidor vuelve a validar cada acción.

| Estado | Acciones disponibles |
|---|---|
| `registrado` | Editar datos · Agendar cita |
| `cita_agendada` | Editar datos · Registrar pago de consulta · Reprogramar cita · Cancelar cita |
| `consulta_pagada` | Editar datos · Registrar revisión · Reprogramar cita |
| `debe_declarar` | Editar datos · Registrar pago del servicio · Corregir revisión |
| `no_debe_declarar` | Editar datos · Corregir revisión |
| `servicio_pagado` | Editar datos · Iniciar trámite |
| `en_proceso` | Editar datos |

### 4.5 Estados de cita y de pago

| Entidad | Campo | Valores |
|---|---|---|
| Cita | `estado_cita` | `agendada` · `atendida` · `cancelada` |
| Cita | `estado_pago` | `pendiente` · `pagada` |
| Pago | `estado` | `pendiente` (monto menor) · `confirmado` (monto exacto o aprobado) · `requiere_revision` (monto mayor) · `anulado` |

---

## 5. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | La primera consulta vale $50.000. Monto menor: pago `pendiente`, la cita no se confirma. Monto exacto: `confirmado`. Monto mayor: `requiere_revision` | Regla 1 | Dominio `evaluarMonto` |
| RN-02 | Cada cita dura 30 minutos. No se permite una cita que se cruce con otra no cancelada. El intervalo es semiabierto: una cita de 10:00 a 10:30 permite otra a las 10:30 y rechaza una a las 10:15 | Regla 2 | Dominio `seCruzan`; BD `citas_sin_cruce` |
| RN-03 | La revisión solo se registra si la primera consulta tiene pago confirmado | Regla 3 | Dominio (transición); servicio verifica el pago en BD |
| RN-04 | El resultado solo puede ser `debe_declarar` o `no_debe_declarar`. El sistema no lo calcula | Regla 4 | BD CHECK; esquema Zod |
| RN-05 | El servicio completo vale $300.000 y solo se registra si el resultado es `debe_declarar`. Menor: `pendiente`; exacto: `confirmado`; mayor: `requiere_revision` | Regla 5 | Dominio `validarRegistroPago`, `evaluarMonto` |
| RN-06 | El trámite pasa a `en_proceso` solo si el resultado es `debe_declarar` y existe pago del servicio confirmado | Regla 6 | Dominio `puedeIniciarTramite`; servicio verifica en BD |
| RN-07 | Estado de la fecha límite: fecha actual anterior → `pendiente`; igual → `vence_hoy`; posterior → `vencida`; sin fecha → `sin_informacion`. La fecha actual se toma en zona `America/Bogota` | Regla 7 | Dominio `estadoFechaLimite` |
| RN-08 | Un cliente no puede tener dos citas en estado `agendada` | Regla 8 | BD `ux_citas_una_activa_por_cliente`; dominio por estado |
| RN-09 | La cédula es única y tiene entre 6 y 10 dígitos | Entradas del plan | BD UNIQUE y CHECK; Zod |
| RN-10 | El teléfono tiene 10 dígitos: móvil que inicia en 3 o fijo que inicia en 60 | Agregada | BD CHECK; Zod |
| RN-11 | El registro exige autorización expresa de tratamiento de datos personales (Ley 1581 de 2012) | Agregada | BD CHECK; Zod |
| RN-12 | La cita debe estar dentro del horario de atención, no en el pasado y a máximo 30 días. Si la agenda el cliente, requiere 2 horas de anticipación | Agregada | Dominio `validarNuevaCita` |
| RN-13 | Un pago en `requiere_revision` se aprueba con observación de al menos 10 caracteres o se anula. Aprobarlo tiene el mismo efecto que un pago exacto | Agregada (desarrolla Reglas 1 y 5) | Dominio y servicio |
| RN-14 | Solo puede existir un pago confirmado por cita (consulta) y uno por cliente (servicio) | Agregada | BD índices parciales |
| RN-15 | Cancelar una cita solo procede si no tiene pago confirmado ni pago en revisión. Los pagos pendientes de esa cita pasan a `anulado`. El trámite vuelve a `registrado` | Agregada | Servicio |
| RN-16 | Reprogramar solo aplica a citas `agendada`; conserva pagos confirmados o en revisión, y repite las validaciones de RN-02 y RN-12. El cliente puede reprogramar una cita con pago confirmado o en revisión mediante verificación de identidad | Agregada | Servicio y BD |
| RN-17 | Registrar la revisión marca la cita como `atendida` | Agregada | Servicio |
| RN-18 | La revisión se corrige solo en `debe_declarar` o `no_debe_declarar`, sin pagos del servicio distintos de `anulado` y con motivo de al menos 10 caracteres | Agregada | Dominio `validarCorreccionRevision` |
| RN-19 | Los montos se guardan en pesos enteros (`INTEGER`). Cada cita y cada pago guardan el valor vigente al momento de crearse | Agregada | BD; configuración |
| RN-20 | Toda operación que cambia datos del trámite registra un evento en `eventos_cliente` dentro de la misma transacción | Agregada | Servicio |
| RN-21 | En el calendario tributario no se solapan rangos de dígitos de un mismo año gravable. El año vigente es el mayor año cargado | Agregada | Dominio `validarNuevoRango` |
| RN-22 | La cédula no aparece en URLs ni en respuestas públicas. En listados del panel se muestra enmascarada (`******2449`) | Plan funcional, sección 12 | Rutas y componentes |
| RN-23 | Solo se anulan pagos en estado `pendiente` o `requiere_revision`, con observación de al menos 10 caracteres | Agregada | Dominio y servicio |

---

## 6. Casos de uso

### 6.1 Catálogo

| ID | Actor | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|---|
| CU-01 Registrar cliente | Cliente o contador | cc, nombre, teléfono, correo, autorización | Cédula no registrada | Cliente en `registrado`; evento `CLIENTE_REGISTRADO` | `DATOS_INVALIDOS`, `CC_DUPLICADA` |
| CU-02 Consultar fecha límite | Cliente | cc | Cliente registrado | Fecha efectiva, estado de fecha, días restantes | `CLIENTE_NO_ENCONTRADO` |
| CU-03 Consultar disponibilidad | Cliente o contador | fecha | Ninguna | Lista de horas libres (cuadrícula de 30 min) | `DATOS_INVALIDOS` |
| CU-04 Agendar cita | Cliente verificado o contador | cliente, fecha, hora | Estado `registrado` | Cita `agendada` con valor $50.000; estado `cita_agendada`; evento `CITA_AGENDADA` | `DATOS_NO_COINCIDEN`, `CITA_ACTIVA_EXISTENTE`, `ACCION_NO_PERMITIDA_EN_ESTADO`, `CITA_EN_PASADO`, `FECHA_FUERA_DE_RANGO`, `FUERA_DE_HORARIO`, `ANTICIPACION_INSUFICIENTE`, `CITA_CRUCE_HORARIO` |
| CU-05 Reprogramar cita | Contador | cita, fecha, hora | Cita `agendada` | Nueva hora; evento `CITA_REPROGRAMADA` | `CITA_NO_MODIFICABLE` y los de horario |
| CU-06 Cancelar cita | Cliente verificado o contador | cita, motivo | Cita `agendada` sin pago confirmado ni en revisión | Cita `cancelada`; pagos pendientes `anulado`; estado `registrado`; evento `CITA_CANCELADA` | `CITA_NO_MODIFICABLE`, `CITA_CON_PAGO` |
| CU-07 Registrar pago de consulta | Contador | cita, monto, método, referencia, fecha | Estado `cita_agendada`; sin pago confirmado | Pago según RN-01; si es exacto: cita `pagada`, estado `consulta_pagada`; evento `PAGO_REGISTRADO` | `ACCION_NO_PERMITIDA_EN_ESTADO`, `PAGO_YA_CONFIRMADO` |
| CU-08 Resolver pago en revisión | Contador | pago, decisión, observación | Pago `requiere_revision` | Aprobar: `confirmado` y transición correspondiente. Anular: `anulado`. Evento `PAGO_APROBADO` o `PAGO_ANULADO` | `PAGO_NO_MODIFICABLE`, `OBSERVACION_REQUERIDA` |
| CU-09 Registrar revisión | Contador | cita, resultado, observaciones | Estado `consulta_pagada`; cita `pagada` | Revisión creada; cita `atendida`; estado según resultado; evento `REVISION_REGISTRADA` | `PAGO_CONSULTA_REQUERIDO`, `REVISION_EXISTENTE` |
| CU-10 Corregir revisión | Contador | revisión, resultado, motivo | RN-18 | Resultado actualizado; estado según resultado; evento `REVISION_CORREGIDA` | `REVISION_NO_CORREGIBLE`, `OBSERVACION_REQUERIDA` |
| CU-11 Registrar pago del servicio | Contador | cliente, monto, método, referencia, fecha | Estado `debe_declarar`; sin pago confirmado | Pago según RN-05; si es exacto: estado `servicio_pagado`; evento `PAGO_REGISTRADO` | `PAGO_SERVICIO_NO_DISPONIBLE`, `PAGO_YA_CONFIRMADO` |
| CU-12 Iniciar trámite | Contador | cliente | RN-06 | Estado `en_proceso`; evento `TRAMITE_INICIADO` | `TRAMITE_NO_HABILITADO` |
| CU-13 Gestionar calendario tributario | Contador | año, dígito desde, dígito hasta, fecha | RN-21 | Rango creado o eliminado; eliminación de datos de demostración | `RANGO_INVALIDO`, `RANGO_SOLAPADO` |
| CU-14 Editar datos del cliente | Contador | nombre, teléfono, correo, fecha límite manual | Cliente existe (la cédula no se edita) | Datos actualizados; evento `DATOS_ACTUALIZADOS` | `DATOS_INVALIDOS` |
| CU-15 Consultar resumen | Contador | ninguna | Ninguna | Conteo por estado, citas del día, pagos en revisión | Ninguno |

### 6.2 Secuencia estándar de una operación con reglas

Todas las operaciones que cambian el estado del trámite (CU-04 a CU-12) siguen la misma secuencia dentro de `conTransaccion`:

1. `SELECT ... FROM clientes WHERE id = $1 FOR UPDATE` (bloquea al cliente mientras dura la operación).
2. Leer los datos que la regla necesita (cita, pagos, revisión).
3. Validar con las funciones puras de `lib/reglas/`. Si una regla falla, lanzan `ErrorDeNegocio` y la transacción se revierte.
4. Escribir el registro principal (cita, pago o revisión).
5. Si corresponde, calcular el nuevo estado con `siguienteEstado(estadoActual, evento)` y actualizar `clientes.estado`.
6. Insertar el evento en `eventos_cliente`.
7. Confirmar la transacción.

Si la base de datos rechaza la escritura por una restricción (por ejemplo, dos citas creadas al mismo tiempo en el mismo horario), el error se traduce al código de negocio con la tabla de la sección 7.5.

Ejemplo, CU-07:

```ts
export async function registrarPago(d: DatosPago) {
  return conTransaccion(async (tx) => {
    const cliente = await bloquearCliente(tx, d.clienteId);
    const cita = d.tipo === 'primera_consulta' ? await obtenerCita(tx, d.citaId!) : null;
    const existeConfirmado = await existePagoConfirmado(tx, d);
    validarRegistroPago({ tipo: d.tipo, estadoCliente: cliente.estado, cita, existeConfirmado });

    const esperado = valorEsperado(d.tipo);
    const estado = evaluarMonto(d.monto, esperado);
    const pagoId = await insertarPago(tx, { ...d, valorEsperado: esperado, estado });

    if (estado === 'confirmado') {
      const evento = d.tipo === 'primera_consulta' ? 'CONFIRMAR_PAGO_CONSULTA' : 'CONFIRMAR_PAGO_SERVICIO';
      const nuevo = siguienteEstado(cliente.estado, evento);
      if (cita) await marcarCitaPagada(tx, cita.id);
      await actualizarEstadoCliente(tx, cliente.id, nuevo);
      await registrarEvento(tx, { clienteId: cliente.id, tipo: 'PAGO_REGISTRADO', anterior: cliente.estado, nuevo, actor: 'contador', detalle: { pagoId, monto: d.monto, estado } });
    } else {
      await registrarEvento(tx, { clienteId: cliente.id, tipo: 'PAGO_REGISTRADO', anterior: cliente.estado, nuevo: cliente.estado, actor: 'contador', detalle: { pagoId, monto: d.monto, estado } });
    }
    return { pagoId, estado };
  });
}
```

---

## 7. Modelo de datos

### 7.1 Relaciones

```text
calendario_renta (independiente)

clientes 1 ──── N citas
clientes 1 ──── N pagos ──── N:1 (opcional) citas
clientes 1 ──── 1 revisiones ──── 1:1 citas
clientes 1 ──── N eventos_cliente

v_clientes_fecha = clientes + fecha límite efectiva (manual o calendario)
```

Las migraciones se guardan en `supabase/migrations/` y continúan la numeración existente (P00 la identifica). En este documento se nombran M1, M2 y M3.

### 7.2 M1 · Tablas

```sql
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
  fecha_limite_renta        DATE,                      -- fecha manual del contador (opcional)
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
  inicio              TIMESTAMP    NOT NULL,           -- hora local de Bogotá, sin zona
  fin                 TIMESTAMP    GENERATED ALWAYS AS (inicio + INTERVAL '30 minutes') STORED,
  duracion_minutos    SMALLINT     NOT NULL DEFAULT 30,
  valor               INTEGER      NOT NULL,           -- valor vigente al agendar
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
  valor_esperado  INTEGER      NOT NULL,               -- tarifa vigente al registrar
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
```

### 7.3 M2 · Vista de fecha límite y seguridad

```sql
-- M2: fecha límite efectiva y cierre de acceso público

CREATE OR REPLACE VIEW v_clientes_fecha
WITH (security_invoker = true) AS
SELECT
  c.*,
  cal.fecha_limite AS fecha_limite_calendario,
  COALESCE(c.fecha_limite_renta, cal.fecha_limite) AS fecha_limite_efectiva,
  CASE
    WHEN c.fecha_limite_renta IS NOT NULL THEN 'manual'
    WHEN cal.fecha_limite IS NOT NULL THEN 'calendario'
    ELSE 'sin_informacion'
  END AS origen_fecha_limite
FROM clientes c
LEFT JOIN calendario_renta cal
  ON cal.anio_gravable = (SELECT MAX(anio_gravable) FROM calendario_renta)
 AND CAST(RIGHT(c.cc, 2) AS SMALLINT) BETWEEN cal.digito_desde AND cal.digito_hasta;

ALTER TABLE calendario_renta ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_cliente  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON calendario_renta, clientes, citas, pagos, revisiones, eventos_cliente
  FROM anon, authenticated;
REVOKE ALL ON v_clientes_fecha FROM anon, authenticated;
```

Las tablas quedan sin políticas: la clave pública de Supabase no puede leerlas ni escribirlas. Todo el acceso ocurre en el servidor mediante `DATABASE_URL`.

### 7.4 M3 · Calendario de demostración

```sql
-- M3: calendario de DEMOSTRACIÓN. Se reemplaza desde el panel con el calendario oficial vigente.
-- Fechas relativas al día en que se aplica, para probar los tres estados de la Regla 7.

WITH hoy AS (SELECT (NOW() AT TIME ZONE 'America/Bogota')::date AS d)
INSERT INTO calendario_renta (anio_gravable, digito_desde, digito_hasta, fecha_limite, es_demo)
SELECT (EXTRACT(YEAR FROM hoy.d)::int - 1)::smallint, r.desde, r.hasta, hoy.d + r.dias, true
FROM hoy,
     (VALUES (0, 19, -10), (20, 39, 0), (40, 59, 10), (60, 79, 30), (80, 99, 60))
       AS r(desde, hasta, dias)
WHERE NOT EXISTS (SELECT 1 FROM calendario_renta);
```

### 7.5 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `clientes_cc_unica` | `CC_DUPLICADA` |
| `23505` | `ux_citas_una_activa_por_cliente` | `CITA_ACTIVA_EXISTENTE` |
| `23505` | `ux_pagos_consulta_confirmado`, `ux_pagos_servicio_confirmado` | `PAGO_YA_CONFIRMADO` |
| `23505` | `revisiones_una_por_cita`, `revisiones_una_por_cliente` | `REVISION_EXISTENTE` |
| `23P01` | `citas_sin_cruce` | `CITA_CRUCE_HORARIO` |
| `23514` | cualquier CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 8. Arquitectura del código

### 8.1 Capas

```text
Pantallas (app/*)  ─────────┐
                            ├──► Rutas API (app/api/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ─┘          │                                │
                                       └──── lib/validacion (Zod)       └──── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: reglas de negocio como funciones puras. No importan `pg`, no leen variables de entorno y no leen el reloj (excepto `ahoraBogota` en `fechas.ts`). Se prueban con Vitest.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única. Las rutas y las páginas importan solo desde aquí.
- Rutas API: validan con Zod, verifican sesión cuando aplica, llaman a `dataService` y responden con `lib/http/respuestas.ts`.
- Las páginas del panel (componentes de servidor) pueden leer con `dataService`. Las acciones que modifican datos se hacen desde componentes cliente que llaman a `/api/contador/*` y luego ejecutan `router.refresh()`.

### 8.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_agenda_tablas.sql
supabase/migrations/NNNN_agenda_vista_seguridad.sql
supabase/migrations/NNNN_agenda_calendario_demo.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/probar-api.mjs

lib/config/negocio.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/estados.ts
lib/reglas/pagos.ts
lib/reglas/agenda.ts
lib/reglas/revisiones.ts
lib/reglas/calendario.ts
lib/reglas/privacidad.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesionContador.ts
lib/http/respuestas.ts
lib/formato.ts
lib/datos/tipos.ts
lib/datos/eventos.ts
lib/datos/clientes.ts
lib/datos/calendario.ts
lib/datos/citas.ts
lib/datos/pagos.ts
lib/datos/revisiones.ts
lib/datos/tramite.ts
lib/datos/resumen.ts
lib/dataService.ts

tests/reglas/fechas.test.ts
tests/reglas/estados.test.ts
tests/reglas/pagos.test.ts
tests/reglas/agenda.test.ts
tests/reglas/revisiones.test.ts
tests/reglas/calendario.test.ts
tests/reglas/privacidad.test.ts
vitest.config.ts

app/page.tsx                       (solo si hoy es la plantilla de Next.js)
app/registro/page.tsx
app/consulta/page.tsx
app/agendar/page.tsx
app/contador/layout.tsx
app/contador/page.tsx
app/contador/clientes/page.tsx
app/contador/clientes/nuevo/page.tsx
app/contador/clientes/[id]/page.tsx
app/contador/agenda/page.tsx
app/contador/pagos/page.tsx
app/contador/calendario/page.tsx

app/api/publico/clientes/route.ts
app/api/publico/fecha-limite/route.ts
app/api/publico/disponibilidad/route.ts
app/api/publico/citas/route.ts
app/api/publico/mi-cita/route.ts
app/api/publico/mi-cita/reprogramar/route.ts
app/api/publico/mi-cita/cancelar/route.ts

app/api/contador/sesion/route.ts
app/api/contador/resumen/route.ts
app/api/contador/clientes/route.ts
app/api/contador/clientes/[id]/route.ts
app/api/contador/clientes/[id]/iniciar-tramite/route.ts
app/api/contador/disponibilidad/route.ts
app/api/contador/citas/route.ts
app/api/contador/citas/[id]/reprogramar/route.ts
app/api/contador/citas/[id]/cancelar/route.ts
app/api/contador/pagos/route.ts
app/api/contador/pagos/[id]/aprobar/route.ts
app/api/contador/pagos/[id]/anular/route.ts
app/api/contador/revisiones/route.ts
app/api/contador/revisiones/[id]/corregir/route.ts
app/api/contador/calendario/route.ts
app/api/contador/calendario/[id]/route.ts
app/api/contador/calendario/demo/route.ts

components/ui/Boton.tsx
components/ui/Campo.tsx
components/ui/Selector.tsx
components/ui/Tarjeta.tsx
components/ui/Insignia.tsx
components/ui/Aviso.tsx
components/ui/Modal.tsx
components/ui/EstadoVacio.tsx
components/publico/FormularioRegistro.tsx
components/publico/FormularioConsulta.tsx
components/publico/FormularioVerificacion.tsx
components/publico/SelectorHorario.tsx
components/publico/ResumenCita.tsx
components/contador/NavegacionPanel.tsx
components/contador/TarjetaIndicador.tsx
components/contador/InsigniaEstado.tsx
components/contador/InsigniaFecha.tsx
components/contador/TablaClientes.tsx
components/contador/FormularioCliente.tsx
components/contador/PanelAcciones.tsx
components/contador/FormularioPago.tsx
components/contador/FormularioRevision.tsx
components/contador/FormularioCita.tsx
components/contador/TablaCitasCliente.tsx
components/contador/TablaPagosCliente.tsx
components/contador/TablaAgenda.tsx
components/contador/TablaPagosRevision.tsx
components/contador/TablaCalendario.tsx
```

### 8.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio y con el plan funcional |
| Las reglas solo viven en `lib/reglas/` | Una sola fuente de verdad, probada con Vitest |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única de acceso a datos |
| Toda ruta `/api/contador/*` llama `exigirContador()` como primera instrucción | Protección aunque falle el middleware |
| Montos como `number` entero en pesos; nunca decimales | RN-19 |
| Fechas como texto `YYYY-MM-DD` y horas como `HH:MM` entre capas | Evita errores de zona horaria (sección 12) |
| No usar `localStorage` para datos del negocio | La persistencia es Postgres |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js 15 y 16 entregan `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 8.4 Configuración de negocio

```ts
// lib/config/negocio.ts
export const TARIFA_PRIMERA_CONSULTA = 50_000;
export const TARIFA_SERVICIO_COMPLETO = 300_000;
export const DURACION_CITA_MINUTOS = 30;
export const ZONA_HORARIA = 'America/Bogota';

// Clave: día ISO (1 = lunes ... 7 = domingo). Bloques [inicio, fin) en HH:MM.
export const HORARIO_ATENCION: Record<number, Array<[string, string]>> = {
  1: [['08:00', '12:00'], ['14:00', '18:00']],
  2: [['08:00', '12:00'], ['14:00', '18:00']],
  3: [['08:00', '12:00'], ['14:00', '18:00']],
  4: [['08:00', '12:00'], ['14:00', '18:00']],
  5: [['08:00', '12:00'], ['14:00', '18:00']],
};

export const ANTICIPACION_MINIMA_CLIENTE_MINUTOS = 120;
export const DIAS_MAXIMOS_AGENDA = 30;
export const LONGITUD_MINIMA_OBSERVACION = 10;
export const INSTRUCCIONES_PAGO =
  'El pago de la primera consulta se realiza por transferencia, Nequi o en efectivo. ' +
  'El contador lo confirma en el sistema antes de la cita.';
```

### 8.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO' | 'CLIENTE_NO_ENCONTRADO' | 'DATOS_NO_COINCIDEN'
  | 'CC_DUPLICADA' | 'CITA_EN_PASADO' | 'FECHA_FUERA_DE_RANGO' | 'FUERA_DE_HORARIO'
  | 'ANTICIPACION_INSUFICIENTE' | 'CITA_CRUCE_HORARIO' | 'CITA_ACTIVA_EXISTENTE'
  | 'CITA_NO_ENCONTRADA' | 'CITA_NO_MODIFICABLE' | 'CITA_CON_PAGO'
  | 'ACCION_NO_PERMITIDA_EN_ESTADO' | 'PAGO_CONSULTA_REQUERIDO' | 'PAGO_SERVICIO_NO_DISPONIBLE'
  | 'PAGO_YA_CONFIRMADO' | 'PAGO_NO_ENCONTRADO' | 'PAGO_NO_MODIFICABLE' | 'OBSERVACION_REQUERIDA'
  | 'REVISION_EXISTENTE' | 'REVISION_NO_ENCONTRADA' | 'REVISION_NO_CORREGIBLE'
  | 'TRAMITE_NO_HABILITADO' | 'RANGO_INVALIDO' | 'RANGO_SOLAPADO' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 9.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 9.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export type EstadoFecha = 'pendiente' | 'vence_hoy' | 'vencida' | 'sin_informacion';
export function ahoraBogota(reloj?: Date): { fecha: string; hora: string; minutos: number };
export function diaSemanaISO(fecha: string): number;            // 1 lunes ... 7 domingo
export function horaAMinutos(hora: string): number;             // '10:30' → 630
export function minutosAHora(minutos: number): string;          // 630 → '10:30'
export function sumarDias(fecha: string, dias: number): string;
export function diasEntre(desde: string, hasta: string): number; // hasta - desde
export function estadoFechaLimite(hoy: string, fechaLimite: string | null):
  { estado: EstadoFecha; diasRestantes: number | null };

// lib/reglas/estados.ts
export type EstadoTramite = 'registrado' | 'cita_agendada' | 'consulta_pagada'
  | 'debe_declarar' | 'no_debe_declarar' | 'servicio_pagado' | 'en_proceso';
export type ResultadoRevision = 'debe_declarar' | 'no_debe_declarar';
export type EventoTramite = 'AGENDAR_CITA' | 'CANCELAR_CITA' | 'CONFIRMAR_PAGO_CONSULTA'
  | 'REVISION_DEBE_DECLARAR' | 'REVISION_NO_DEBE_DECLARAR'
  | 'CORRECCION_A_DEBE_DECLARAR' | 'CORRECCION_A_NO_DEBE_DECLARAR'
  | 'CONFIRMAR_PAGO_SERVICIO' | 'INICIAR_TRAMITE';
export type AccionContador = 'EDITAR_DATOS' | 'AGENDAR_CITA' | 'REPROGRAMAR_CITA' | 'CANCELAR_CITA'
  | 'REGISTRAR_PAGO_CONSULTA' | 'REGISTRAR_REVISION' | 'CORREGIR_REVISION'
  | 'REGISTRAR_PAGO_SERVICIO' | 'INICIAR_TRAMITE';
export const ETIQUETA_ESTADO: Record<EstadoTramite, string>;          // sección 4.2
export const TRANSICIONES: Record<EstadoTramite, Partial<Record<EventoTramite, EstadoTramite>>>; // 4.3
export function siguienteEstado(actual: EstadoTramite, evento: EventoTramite): EstadoTramite;
export function accionesPermitidas(estado: EstadoTramite): AccionContador[];                    // 4.4
export function puedeIniciarTramite(d: {
  estado: EstadoTramite; resultadoRevision: ResultadoRevision | null; tienePagoServicioConfirmado: boolean;
}): boolean;

// lib/reglas/pagos.ts
export type TipoPago = 'primera_consulta' | 'servicio_completo';
export type EstadoPago = 'pendiente' | 'confirmado' | 'requiere_revision' | 'anulado';
export function valorEsperado(tipo: TipoPago): number;
export function evaluarMonto(monto: number, esperado: number): 'pendiente' | 'confirmado' | 'requiere_revision';
export function validarRegistroPago(d: {
  tipo: TipoPago; estadoCliente: EstadoTramite;
  cita: { estadoCita: 'agendada' | 'atendida' | 'cancelada'; estadoPago: 'pendiente' | 'pagada' } | null;
  existeConfirmado: boolean;
}): void;
export function validarResolucionPago(d: { estadoPago: EstadoPago; decision: 'aprobar' | 'anular'; observacion: string }): void;

// lib/reglas/agenda.ts
export type OrigenCita = 'cliente' | 'contador';
export interface CitaOcupada { inicio: string; fin: string }   // 'HH:MM' del mismo día
export interface Ahora { fecha: string; minutos: number }
export function seCruzan(a: { inicio: number; fin: number }, b: { inicio: number; fin: number }): boolean;
export function estaDentroDelHorario(fecha: string, hora: string): boolean;
export function validarNuevaCita(d: { fecha: string; hora: string; ahora: Ahora; ocupadas: CitaOcupada[]; origen: OrigenCita }): void;
export function calcularHorariosDisponibles(d: { fecha: string; ahora: Ahora; ocupadas: CitaOcupada[]; origen: OrigenCita }): string[];

// lib/reglas/revisiones.ts
export function validarRegistroRevision(d: { estadoCliente: EstadoTramite; citaPagada: boolean; existeRevision: boolean }): void;
export function validarCorreccionRevision(d: {
  estadoCliente: EstadoTramite; resultadoActual: ResultadoRevision; resultadoNuevo: ResultadoRevision;
  pagosServicioNoAnulados: number; motivo: string;
}): EventoTramite;

// lib/reglas/calendario.ts
export interface RangoCalendario { anioGravable: number; digitoDesde: number; digitoHasta: number; fechaLimite: string }
export function dosUltimosDigitos(cc: string): number;                 // '1004567800' → 0
export function buscarFechaEnCalendario(cc: string, rangos: RangoCalendario[]): string | null;
export function rangosSeSolapan(a: RangoCalendario, b: RangoCalendario): boolean;
export function validarNuevoRango(nuevo: RangoCalendario, existentes: RangoCalendario[]): void;

// lib/reglas/privacidad.ts
export function enmascararCC(cc: string): string;                       // '1082912449' → '******2449'
export function coincidenUltimos4(telefono: string, ultimos4: string): boolean;
```

Orden de validación en `validarNuevaCita` (el primer fallo detiene la validación):

1. `CITA_EN_PASADO`: fecha y hora anteriores a `ahora`.
2. `FECHA_FUERA_DE_RANGO`: más de `DIAS_MAXIMOS_AGENDA` días después de `ahora.fecha`.
3. `FUERA_DE_HORARIO`: el intervalo [hora, hora + 30) no cabe completo en un bloque del día.
4. `ANTICIPACION_INSUFICIENTE`: solo si `origen === 'cliente'` y faltan menos de 120 minutos.
5. `CITA_CRUCE_HORARIO`: se cruza con alguna cita ocupada.

`calcularHorariosDisponibles` recorre cada bloque del día en pasos de 30 minutos desde el inicio del bloque y devuelve las horas que pasan `validarNuevaCita`.

### 8.6 Firmas de `dataService`

```ts
// Clientes
registrarCliente(d: DatosRegistroCliente, origen: 'cliente' | 'contador'): Promise<{ id: string }>
verificarCliente(cc: string, ultimos4: string): Promise<ClienteBasico>          // DATOS_NO_COINCIDEN
listarClientes(f: { busqueda?: string; estado?: EstadoTramite }): Promise<FilaCliente[]>
obtenerDetalleCliente(id: string): Promise<DetalleCliente>
actualizarCliente(id: string, cambios: CambiosCliente): Promise<void>
consultarFechaLimite(cc: string): Promise<ResultadoFechaLimite>

// Calendario
listarCalendario(): Promise<FilaCalendario[]>
agregarRangoCalendario(r: RangoCalendario): Promise<{ id: number }>
eliminarRangoCalendario(id: number): Promise<void>
eliminarCalendarioDemo(): Promise<{ eliminados: number }>

// Agenda
obtenerHorariosDisponibles(fecha: string, origen: OrigenCita): Promise<string[]>
agendarCita(d: { clienteId: string; fecha: string; hora: string; origen: OrigenCita }): Promise<{ citaId: number }>
reprogramarCita(citaId: number, fecha: string, hora: string): Promise<void>
cancelarCita(citaId: number, motivo: string, actor: 'cliente' | 'contador'): Promise<void>
obtenerCitaActiva(clienteId: string): Promise<CitaResumen | null>
listarCitas(desde: string, hasta: string): Promise<FilaCita[]>

// Pagos
registrarPago(d: DatosPago): Promise<{ pagoId: number; estado: EstadoPago }>
aprobarPago(pagoId: number, observacion: string): Promise<void>
anularPago(pagoId: number, observacion: string): Promise<void>
listarPagosEnRevision(): Promise<FilaPago[]>

// Revisión y trámite
registrarRevision(d: { citaId: number; resultado: ResultadoRevision; observaciones?: string }): Promise<{ revisionId: number }>
corregirRevision(revisionId: number, resultado: ResultadoRevision, motivo: string): Promise<void>
iniciarTramite(clienteId: string): Promise<void>

// Panel
obtenerResumen(): Promise<ResumenPanel>
```

Tipos de salida principales (`lib/datos/tipos.ts`):

```ts
interface FilaCliente { id: string; nombre: string; ccEnmascarada: string; telefono: string;
  estado: EstadoTramite; fechaLimite: string | null; estadoFecha: EstadoFecha; diasRestantes: number | null }

interface DetalleCliente {
  cliente: { id: string; cc: string; nombre: string; telefono: string; correo: string; estado: EstadoTramite;
             origenRegistro: 'cliente' | 'contador'; creadoEn: string };
  fecha: { fechaLimite: string | null; origen: 'manual' | 'calendario' | 'sin_informacion';
           estado: EstadoFecha; diasRestantes: number | null; fechaManual: string | null };
  citas: Array<{ id: number; fecha: string; hora: string; horaFin: string; valor: number;
                 estadoCita: string; estadoPago: string; origen: string; motivoCancelacion: string | null }>;
  pagos: Array<{ id: number; tipo: TipoPago; citaId: number | null; monto: number; valorEsperado: number;
                 metodo: string; referencia: string | null; estado: EstadoPago; fechaPago: string; observacion: string | null }>;
  revision: { id: number; citaId: number; resultado: ResultadoRevision; observaciones: string | null; fechaRevision: string } | null;
  eventos: Array<{ id: number; tipo: string; estadoAnterior: string | null; estadoNuevo: string | null;
                   actor: string; detalle: Record<string, unknown>; creadoEn: string }>;
  acciones: AccionContador[];
  puedeIniciarTramite: boolean;
}

interface ResultadoFechaLimite { fechaLimite: string | null; estado: EstadoFecha; diasRestantes: number | null }

interface ResumenPanel { porEstado: Record<EstadoTramite, number>; citasHoy: FilaCita[];
  pagosEnRevision: number; totalClientes: number }
```

### 8.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → 'YYYY-MM-DD HH:MM:SS'
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids y COUNT) → number

const globalParaPool = globalThis as unknown as { poolAgenda?: Pool };

export const pool = globalParaPool.poolAgenda ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolAgenda = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }

export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> {
  // BEGIN → trabajo(tx) → COMMIT; en error: ROLLBACK y relanzar; siempre release()
}
```

`DATABASE_URL` es la cadena del pooler en modo transacción de Supabase (puerto 6543). Los parsers de tipo evitan que `pg` convierta fechas sin zona a objetos `Date` con la zona del servidor (en Vercel, UTC).

---

## 9. Contratos de API

### 9.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "CITA_CRUCE_HORARIO", "mensaje": "Ese horario se cruza con otra cita.", "detalles": null } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 9.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión como contador. |
| `CLIENTE_NO_ENCONTRADO` | 404 | No hay información registrada para esta cédula. |
| `DATOS_NO_COINCIDEN` | 404 | No encontramos un registro con esos datos. |
| `CC_DUPLICADA` | 409 | Esta cédula ya está registrada. |
| `CITA_EN_PASADO` | 422 | No es posible agendar en una fecha u hora que ya pasó. |
| `FECHA_FUERA_DE_RANGO` | 422 | Solo se puede agendar dentro de los próximos 30 días. |
| `FUERA_DE_HORARIO` | 422 | La cita debe quedar dentro del horario de atención. |
| `ANTICIPACION_INSUFICIENTE` | 422 | Las citas se agendan con al menos 2 horas de anticipación. |
| `CITA_CRUCE_HORARIO` | 409 | Ese horario se cruza con otra cita. |
| `CITA_ACTIVA_EXISTENTE` | 409 | Ya existe una cita activa. Cancélela o finalícela antes de solicitar otra. |
| `CITA_NO_ENCONTRADA` | 404 | La cita no existe. |
| `CITA_NO_MODIFICABLE` | 409 | La cita ya fue atendida o cancelada. |
| `CITA_CON_PAGO` | 409 | La cita tiene un pago confirmado o en revisión; reprográmela en lugar de cancelarla. |
| `CITA_SIN_PAGO` | 409 | Para reprogramar por este medio, la cita debe tener un pago confirmado o en revisión. |
| `ACCION_NO_PERMITIDA_EN_ESTADO` | 409 | Esta acción no está disponible en el estado actual del trámite. |
| `PAGO_CONSULTA_REQUERIDO` | 409 | La revisión requiere el pago confirmado de la primera consulta. |
| `PAGO_SERVICIO_NO_DISPONIBLE` | 409 | El pago del servicio solo procede cuando el resultado es "Debe declarar". |
| `PAGO_YA_CONFIRMADO` | 409 | Ya existe un pago confirmado para este concepto. |
| `PAGO_NO_ENCONTRADO` | 404 | El pago no existe. |
| `PAGO_NO_MODIFICABLE` | 409 | Este pago no se puede aprobar ni anular en su estado actual. |
| `OBSERVACION_REQUERIDA` | 400 | Escriba una observación de al menos 10 caracteres. |
| `REVISION_EXISTENTE` | 409 | Este cliente ya tiene una revisión registrada. |
| `REVISION_NO_ENCONTRADA` | 404 | La revisión no existe. |
| `REVISION_NO_CORREGIBLE` | 409 | La revisión no se puede corregir: existen pagos del servicio sin anular o el trámite ya avanzó. |
| `TRAMITE_NO_HABILITADO` | 409 | El trámite solo inicia con resultado "Debe declarar" y el pago del servicio confirmado. |
| `RANGO_INVALIDO` | 400 | El rango de dígitos no es válido. |
| `RANGO_SOLAPADO` | 409 | El rango se cruza con otro del mismo año gravable. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 9.3 Endpoints públicos

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` | Errores |
|---|---|---|---|
| `POST /api/publico/clientes` | `{ cc, nombre, telefono, correo, aceptaTratamientoDatos }` | `{ registrado: true }` (201) | `DATOS_INVALIDOS`, `CC_DUPLICADA` |
| `POST /api/publico/fecha-limite` | `{ cc }` | `ResultadoFechaLimite` | `CLIENTE_NO_ENCONTRADO` |
| `GET /api/publico/disponibilidad?fecha=YYYY-MM-DD` | | `{ fecha, horarios: string[] }` | `DATOS_INVALIDOS` |
| `POST /api/publico/citas` | `{ cc, ultimos4, fecha, hora }` | `{ fecha, hora, horaFin, valor, instruccionesPago }` (201) | `DATOS_NO_COINCIDEN` y los de CU-04 |
| `POST /api/publico/mi-cita` | `{ cc, ultimos4 }` | `{ cita: CitaResumen \| null, estadoTramite, etiquetaEstado }` | `DATOS_NO_COINCIDEN` |
| `POST /api/publico/mi-cita/reprogramar` | `{ cc, ultimos4, fecha, hora }` | `{ reprogramada: true, cita }` | `DATOS_NO_COINCIDEN`, `CITA_NO_ENCONTRADA`, `CITA_SIN_PAGO` y los de horario |
| `POST /api/publico/mi-cita/cancelar` | `{ cc, ultimos4, motivo? }` | `{ cancelada: true }` | `DATOS_NO_COINCIDEN`, `CITA_NO_ENCONTRADA`, `CITA_CON_PAGO` |

La cédula viaja en el cuerpo de peticiones `POST`, nunca en la URL. Las respuestas públicas no devuelven la cédula, el teléfono ni el correo. `disponibilidad` pública usa `origen: 'cliente'`.

### 9.4 Endpoints del contador

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/contador/sesion` | | `{ nombre, correo }` |
| `GET /api/contador/resumen` | | `ResumenPanel` |
| `GET /api/contador/clientes?busqueda=&estado=` | | `FilaCliente[]` |
| `POST /api/contador/clientes` | `{ cc, nombre, telefono, correo, aceptaTratamientoDatos }` | `{ id }` (201) |
| `GET /api/contador/clientes/[id]` | | `DetalleCliente` |
| `PATCH /api/contador/clientes/[id]` | `{ nombre?, telefono?, correo?, fechaLimiteManual?: string \| null }` | `{ actualizado: true }` |
| `POST /api/contador/clientes/[id]/iniciar-tramite` | | `{ estado: 'en_proceso' }` |
| `GET /api/contador/disponibilidad?fecha=` | | `{ fecha, horarios }` (origen contador) |
| `GET /api/contador/citas?desde=&hasta=` | | `FilaCita[]` |
| `POST /api/contador/citas` | `{ clienteId, fecha, hora }` | `{ citaId }` (201) |
| `POST /api/contador/citas/[id]/reprogramar` | `{ fecha, hora }` | `{ reprogramada: true }` |
| `POST /api/contador/citas/[id]/cancelar` | `{ motivo }` | `{ cancelada: true }` |
| `GET /api/contador/pagos?estado=requiere_revision` | | `FilaPago[]` |
| `POST /api/contador/pagos` | `{ clienteId, tipo, citaId?, monto, metodo, referencia?, fechaPago }` | `{ pagoId, estado }` (201) |
| `POST /api/contador/pagos/[id]/aprobar` | `{ observacion }` | `{ aprobado: true }` |
| `POST /api/contador/pagos/[id]/anular` | `{ observacion }` | `{ anulado: true }` |
| `POST /api/contador/revisiones` | `{ citaId, resultado, observaciones? }` | `{ revisionId }` (201) |
| `POST /api/contador/revisiones/[id]/corregir` | `{ resultado, motivo }` | `{ corregida: true }` |
| `GET /api/contador/calendario` | | `FilaCalendario[]` |
| `POST /api/contador/calendario` | `{ anioGravable, digitoDesde, digitoHasta, fechaLimite }` | `{ id }` (201) |
| `DELETE /api/contador/calendario/[id]` | | `{ eliminado: true }` |
| `DELETE /api/contador/calendario/demo` | | `{ eliminados }` |

### 9.5 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaCC` | texto sin espacios, `^[0-9]{6,10}$` |
| `esquemaTelefono` | `^(3[0-9]{9}\|60[0-9]{8})$` |
| `esquemaUltimos4` | `^[0-9]{4}$` |
| `esquemaFecha` | `^\d{4}-\d{2}-\d{2}$` y fecha real |
| `esquemaHora` | `^([01]\d\|2[0-3]):[0-5]\d$` |
| `esquemaRegistroCliente` | cc, nombre (3 a 120, recortado), teléfono, correo (`email()`, máximo 160), `aceptaTratamientoDatos: z.literal(true)` |
| `esquemaCambiosCliente` | nombre, teléfono, correo opcionales; `fechaLimiteManual` fecha o `null` |
| `esquemaAgendarPublico` | cc, ultimos4, fecha, hora |
| `esquemaAgendarContador` | clienteId (uuid), fecha, hora |
| `esquemaPago` | clienteId, tipo, citaId (requerido si tipo es `primera_consulta`), monto entero positivo, método, referencia opcional (máximo 80), fechaPago |
| `esquemaObservacion` | texto recortado, mínimo 10 |
| `esquemaRevision` | citaId entero, resultado enum, observaciones opcional (máximo 2000) |
| `esquemaCorreccion` | resultado enum, motivo mínimo 10 |
| `esquemaRango` | año 2020 a 2100, dígitos 0 a 99, desde ≤ hasta, fechaLimite |

---

## 10. Pantallas

### 10.1 Módulo público

| Ruta | Contenido |
|---|---|
| `/` | Título "Agenda tributaria". Texto: "Consulte su fecha límite de declaración de renta y agende su primera consulta con el contador." Tres tarjetas con enlace: Registrarme, Consultar mi fecha límite, Agendar o ver mi cita. Recuadro informativo: primera consulta de 30 minutos por $50.000. Pie con el aviso de tratamiento de datos (10.3). Si `app/page.tsx` ya tiene contenido propio del proyecto, se conserva y se agregan las tres tarjetas. |
| `/registro` | Formulario: cédula, nombre completo, teléfono, correo, casilla de autorización con el texto de 10.3. Validación en el navegador con el mismo esquema Zod. Pantalla de éxito con enlace a `/agendar`. Si la cédula existe: mensaje de `CC_DUPLICADA`. |
| `/consulta` | Campo de cédula. Resultado: fecha en formato largo ("15 de agosto de 2026"), insignia del estado de fecha y texto de días ("Faltan 10 días", "Vence hoy", "Venció hace 3 días"). Sin fecha: "Aún no hay fecha límite registrada para su cédula". No registrado: mensaje de `CLIENTE_NO_ENCONTRADO` y enlace a `/registro`. |
| `/agendar` | Paso 1: verificación con cédula y últimos cuatro dígitos del teléfono. Paso 2a, si tiene cita activa: resumen (fecha, hora, estado del pago, estado del trámite); si no está pagada ni en revisión, puede cancelar; si está pagada o en revisión, puede reprogramarla y conserva el pago. Paso 2b, si no tiene cita: selector de fecha (hoy a 30 días), cuadrícula de horas disponibles como botones, confirmación. Pantalla final con resumen e `INSTRUCCIONES_PAGO`. Si el trámite ya avanzó más allá de la cita: mensaje con la etiqueta del estado. |

### 10.2 Panel del contador

| Ruta | Contenido |
|---|---|
| Layout `/contador` | Verifica la sesión con `obtenerContador()`; sin sesión redirige al login existente. Barra lateral (cajón en móvil): Resumen, Clientes, Agenda, Pagos en revisión, Calendario tributario. Nombre del contador y botón de cerrar sesión del login existente. |
| `/contador` | Cuatro indicadores: clientes totales, citas de hoy, pagos en revisión, trámites en proceso. Conteo por estado (siete insignias con número, cada una enlaza al listado filtrado). Tabla de citas de hoy: hora, cliente (enlace al detalle), estado de la cita, estado del pago. |
| `/contador/clientes` | Buscador por nombre o cédula. Tabla: nombre, cédula enmascarada, teléfono, estado (insignia), fecha límite (insignia), enlace "Ver". Botón "Registrar cliente". Estado vacío con enlace al registro. |
| `/contador/clientes/nuevo` | Mismo formulario de registro; la casilla dice "El cliente autorizó el tratamiento de sus datos personales". Al guardar, redirige al detalle. |
| `/contador/clientes/[id]` | Encabezado: nombre e insignia de estado. Tarjeta de datos: cédula completa, teléfono, correo, fecha límite con origen (manual o calendario), insignia de fecha y botón "Editar". Tarjeta "Siguiente paso" (`PanelAcciones`): un botón por cada acción de `accionesPermitidas`, cada uno abre un modal con su formulario. Tabla de citas. Tabla de pagos con acciones "Aprobar" y "Anular" en pagos `requiere_revision` y "Anular" en `pendiente`. Tarjeta de revisión (resultado, observaciones, fecha). |
| `/contador/agenda` | Selector de día (por defecto hoy) con botones día anterior y siguiente. Tabla de citas del día: hora, cliente, estado de cita, estado de pago, acciones (ver cliente, reprogramar, cancelar). Botón "Agendar cita": modal con buscador de clientes en estado `registrado`, fecha y horas disponibles; incluye la opción de hora manual en pasos de 5 minutos. |
| `/contador/pagos` | Tabla de pagos en `requiere_revision`: cliente, tipo, monto, valor esperado, diferencia, método, fecha, acciones Aprobar y Anular (modal con observación obligatoria). |
| `/contador/calendario` | Aviso si existen filas `es_demo` con botón "Eliminar datos de demostración". Tabla por año gravable: dígitos desde, hasta, fecha límite, eliminar. Formulario para agregar rango. Texto de ayuda: "Cargue las fechas del calendario tributario oficial vigente para personas naturales, según los dos últimos dígitos del NIT o cédula." |

Formularios de los modales del detalle:

| Acción | Campos |
|---|---|
| Registrar pago de consulta | Monto (precargado 50.000, editable), método, referencia, fecha de pago (hoy). Muestra el resultado esperado según RN-01 antes de guardar: "Se confirmará", "Quedará pendiente", "Quedará en revisión". |
| Registrar pago del servicio | Igual con 300.000. |
| Registrar revisión | Resultado (dos opciones), observaciones. Texto: "El sistema registra la decisión del contador; no la calcula." |
| Corregir revisión | Nuevo resultado y motivo obligatorio. |
| Reprogramar cita | Fecha y horas disponibles. |
| Cancelar cita | Motivo obligatorio. |
| Iniciar trámite | Confirmación con el resumen de las dos condiciones de RN-06. |
| Editar datos | Nombre, teléfono, correo, fecha límite manual (con opción "Usar calendario"). |

### 10.3 Textos fijos

Autorización de datos (registro público):

> Autorizo el tratamiento de mis datos personales (cédula, nombre, teléfono y correo) para gestionar mi consulta tributaria y contactarme sobre ella, conforme a la Ley 1581 de 2012. Puedo solicitar la consulta, actualización o supresión de mis datos al contador.

Aviso en el pie del módulo público:

> Los datos registrados se usan únicamente para gestionar su consulta. El sistema no calcula si usted debe declarar: esa decisión la toma el contador.

---

## 11. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#1E3A5F` | Botones principales, encabezados |
| `--color-primario-suave` | `#E8EEF5` | Fondos de selección, hover |
| `--color-exito` | `#2F7D4F` | Confirmado, en proceso |
| `--color-advertencia` | `#B7791F` | En revisión, vence hoy, debe declarar |
| `--color-peligro` | `#B83232` | Vencida, errores |
| `--color-fondo` | `#F6F7F9` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, tablas, modales |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes del login. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

| Insignia | Fondo / texto |
|---|---|
| `registrado` | gris claro / gris oscuro |
| `cita_agendada` | `--color-primario-suave` / `--color-primario` |
| `consulta_pagada` | azul claro / azul oscuro |
| `debe_declarar` | ámbar claro / `--color-advertencia` |
| `no_debe_declarar` | gris / gris oscuro |
| `servicio_pagado` | verde claro / `--color-exito` |
| `en_proceso` | `--color-exito` / blanco |
| Fecha `pendiente` | azul claro / azul oscuro |
| Fecha `vence_hoy` | ámbar claro / `--color-advertencia` |
| Fecha `vencida` | rojo claro / `--color-peligro` |
| Fecha `sin_informacion` | gris claro / gris oscuro |

Criterios: tipografía del proyecto (si no hay, Inter con `next/font`), bordes redondeados de 8 px, sombras leves, montos con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`, fechas legibles con `Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' })` sobre fechas `YYYY-MM-DD`, íconos de Lucide si el proyecto ya los tiene, sin emojis. Las tablas se convierten en tarjetas apiladas en pantallas menores a 640 px.

---

## 12. Fechas, horas y zona horaria

Vercel ejecuta el servidor en UTC; Colombia está en UTC-5 sin horario de verano. Si "hoy" se calcula en UTC, entre las 19:00 y la medianoche de Bogotá el sistema creería que ya es el día siguiente y la Regla 7 fallaría.

| Regla | Implementación |
|---|---|
| "Hoy" y "ahora" | Solo con `ahoraBogota()` (usa `Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`) |
| Fechas entre capas | Texto `YYYY-MM-DD` |
| Horas entre capas | Texto `HH:MM` |
| Inicio de cita en BD | `TIMESTAMP` sin zona con la hora local de Bogotá; se escribe con `$1::timestamp` a partir de `` `${fecha} ${hora}:00` `` |
| Lectura desde BD | Parsers de `pg` devuelven texto (sección 8.7); en SQL se puede usar `to_char(inicio, 'HH24:MI')` |
| Día de la semana | `diaSemanaISO` calcula con `Date.UTC(año, mes - 1, día)` y `getUTCDay()` |
| Diferencia de días | `diasEntre` con `Date.UTC` sobre ambas fechas, dividido entre 86 400 000 |

---

## 13. Seguridad y datos personales

| Medida | Detalle |
|---|---|
| Autorización de tratamiento (Ley 1581 de 2012) | Casilla obligatoria; se guarda la fecha y hora de la autorización |
| Cédula fuera de URLs | Identificador interno UUID; la cédula viaja en cuerpos `POST` |
| Respuestas públicas mínimas | No devuelven cédula, teléfono ni correo |
| Verificación para citas | Cédula más últimos cuatro dígitos del teléfono; mensaje genérico `DATOS_NO_COINCIDEN` tanto si la cédula no existe como si los dígitos no coinciden |
| Cédula enmascarada en listados | `******2449`; completa solo en el detalle del cliente |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Validación en el servidor | Zod en cada ruta y reglas en `lib/reglas/`, aunque la interfaz ya oculte la acción |
| Protección del panel | Middleware o proxy existente y `exigirContador()` en cada ruta de `/api/contador` |
| Sin datos de tarjetas | Los pagos guardan monto, método y referencia; nunca números de tarjeta o cuenta |
| Errores internos | Se registran con `console.error` en el servidor; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

Limitación conocida: el sistema no limita la cantidad de intentos de verificación por cédula. Un límite de intentos requiere un almacén compartido entre instancias de Vercel y queda fuera de esta versión.

---

## 14. Pruebas

### 14.1 Pruebas unitarias de reglas (Vitest)

Fecha de referencia para las pruebas de agenda: `ahora = { fecha: '2030-01-02', minutos: 480 }` (2030-01-02 a las 08:00; día ISO 3). El 2030-01-07 es día ISO 1 y el 2030-01-06 es día ISO 7.

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `evaluarMonto` | 49 000 / 50 000 | `pendiente` |
| T-02 | `evaluarMonto` | 50 000 / 50 000 | `confirmado` |
| T-03 | `evaluarMonto` | 60 000 / 50 000 | `requiere_revision` |
| T-04 | `evaluarMonto` | 299 000 / 300 000 | `pendiente` |
| T-05 | `evaluarMonto` | 300 000 / 300 000 | `confirmado` |
| T-06 | `evaluarMonto` | 350 000 / 300 000 | `requiere_revision` |
| T-07 | `seCruzan` | 10:00 a 10:30 contra 10:15 a 10:45 | `true` |
| T-08 | `seCruzan` | 10:00 a 10:30 contra 10:30 a 11:00 | `false` |
| T-09 | `seCruzan` | 10:00 a 10:30 contra 09:45 a 10:15 | `true` |
| T-10 | `validarNuevaCita` | 2030-01-07 10:15, ocupada 10:00 a 10:30 | `CITA_CRUCE_HORARIO` |
| T-11 | `validarNuevaCita` | 2030-01-07 10:30, ocupada 10:00 a 10:30 | sin error |
| T-12 | `validarNuevaCita` | 2030-01-07 11:45 | `FUERA_DE_HORARIO` |
| T-13 | `validarNuevaCita` | 2030-01-06 10:00 | `FUERA_DE_HORARIO` |
| T-14 | `validarNuevaCita` | 2030-01-01 10:00 | `CITA_EN_PASADO` |
| T-15 | `validarNuevaCita` | 2030-01-02 09:00 con origen `cliente` / con origen `contador` | `ANTICIPACION_INSUFICIENTE` / sin error |
| T-16 | `validarNuevaCita` | 2030-02-02 10:00 | `FECHA_FUERA_DE_RANGO` |
| T-17 | `calcularHorariosDisponibles` | 2030-01-07, sin ocupadas, origen `contador` | 16 horas, de `08:00` a `11:30` y de `14:00` a `17:30` |
| T-18 | `calcularHorariosDisponibles` | 2030-01-07, ocupada 10:00 a 10:30 | 15 horas; no incluye `10:00`; incluye `10:30` |
| T-19 | `estadoFechaLimite` | hoy 2030-01-02, límite 2030-01-12 | `pendiente`, 10 |
| T-20 | `estadoFechaLimite` | hoy y límite 2030-01-02 | `vence_hoy`, 0 |
| T-21 | `estadoFechaLimite` | hoy 2030-01-05, límite 2030-01-02 | `vencida`, -3 |
| T-22 | `estadoFechaLimite` | límite `null` | `sin_informacion`, `null` |
| T-23 | `siguienteEstado` | `registrado` + `AGENDAR_CITA` | `cita_agendada` |
| T-24 | `siguienteEstado` | `cita_agendada` + `REVISION_DEBE_DECLARAR` | `ACCION_NO_PERMITIDA_EN_ESTADO` (Regla 3) |
| T-25 | `siguienteEstado` | `no_debe_declarar` + `CONFIRMAR_PAGO_SERVICIO` | `ACCION_NO_PERMITIDA_EN_ESTADO` (Regla 5) |
| T-26 | `puedeIniciarTramite` | (`servicio_pagado`, `debe_declarar`, `true`) / (`servicio_pagado`, `debe_declarar`, `false`) / (`servicio_pagado`, `no_debe_declarar`, `true`) | `true` / `false` / `false` |
| T-27 | `validarRegistroPago` | servicio con estado `no_debe_declarar` | `PAGO_SERVICIO_NO_DISPONIBLE` |
| T-28 | `validarRegistroPago` | consulta con `existeConfirmado: true` | `PAGO_YA_CONFIRMADO` |
| T-29 | `accionesPermitidas` | `servicio_pagado` | incluye `INICIAR_TRAMITE`; no incluye `REGISTRAR_PAGO_SERVICIO` |
| T-30 | `buscarFechaEnCalendario` | cc `1004567849`, rangos de 2025 y 2026 | fecha del rango 40 a 59 de 2026 |
| T-31 | `dosUltimosDigitos` | `1004567800` | 0 |
| T-32 | `validarNuevoRango` | 2026: 10 a 30 contra existente 2026: 0 a 19 | `RANGO_SOLAPADO` |
| T-33 | `enmascararCC` | `1082912449` | `******2449` |
| T-34 | `coincidenUltimos4` | `3001234567`, `4567` | `true` |
| T-35 | `validarCorreccionRevision` | `debe_declarar` → `no_debe_declarar`, 1 pago de servicio no anulado | `REVISION_NO_CORREGIBLE` |
| T-36 | `validarResolucionPago` | pago `confirmado`, decisión `anular` | `PAGO_NO_MODIFICABLE` |

Comando: `npm test`. Todas deben pasar antes de continuar con la fase 3.

### 14.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (se ejecuta con `npm run probar:flujo`) usa `dataService` directamente con cédulas de prueba `9999990001` y `9999990002`, imprime una línea `OK` o `FALLA` por paso y, al final, borra todos los registros de esas cédulas (en orden: eventos, revisiones, pagos, citas, clientes).

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Registrar cliente 1 | Estado `registrado` |
| 2 | Registrar la misma cédula | `CC_DUPLICADA` |
| 3 | Agendar al cliente 1 en el primer horario disponible (origen `contador`) | Estado `cita_agendada` |
| 4 | Agendar al cliente 2 en la misma hora | `CITA_CRUCE_HORARIO` |
| 5 | Agendar otra cita al cliente 1 | `CITA_ACTIVA_EXISTENTE` o `ACCION_NO_PERMITIDA_EN_ESTADO` |
| 6 | Registrar revisión del cliente 1 | `ACCION_NO_PERMITIDA_EN_ESTADO` o `PAGO_CONSULTA_REQUERIDO` |
| 7 | Pago de consulta de 49 000 | Pago `pendiente`; estado sigue `cita_agendada` |
| 8 | Pago de consulta de 50 000 | Pago `confirmado`; estado `consulta_pagada` |
| 9 | Revisión `debe_declarar` | Estado `debe_declarar`; cita `atendida` |
| 10 | Iniciar trámite | `TRAMITE_NO_HABILITADO` |
| 11 | Pago de servicio de 299 000 | `pendiente` |
| 12 | Pago de servicio de 300 000 | `confirmado`; estado `servicio_pagado` |
| 13 | Iniciar trámite | Estado `en_proceso` |
| 14 | Leer el detalle del cliente 1 | 1 cita, 4 pagos, 1 revisión, eventos de cada paso |

### 14.3 Prueba de la API pública

`scripts/probar-api.mjs` (`npm run probar:api`, con `npm run dev` activo) recorre los endpoints públicos con la cédula `9999990003`, imprime `OK` o `FALLA` por paso y limpia los registros con `pg` al final.

| Paso | Petición | Esperado |
|---|---|---|
| 1 | Registro válido | 201 |
| 2 | Registro repetido | 409 `CC_DUPLICADA` |
| 3 | Registro sin autorización | 400 `DATOS_INVALIDOS` |
| 4 | Fecha límite | 200 con `estado` |
| 5 | Fecha límite de cédula inexistente | 404 `CLIENTE_NO_ENCONTRADO` |
| 6 | Disponibilidad del primer día hábil siguiente | 200 con horarios |
| 7 | Agendar con últimos 4 incorrectos | 404 `DATOS_NO_COINCIDEN` |
| 8 | Agendar correcto | 201 |
| 9 | Agendar de nuevo | 409 `CITA_ACTIVA_EXISTENTE` |
| 10 | Mi cita | 200 con la cita |
| 11 | Cancelar | 200 |
| 12 | Mi cita | 200 con `cita: null` |

### 14.4 Aceptación (criterio de terminado del plan funcional)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md` con resultado y observación por fila.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Registrar al cliente A desde `/registro` | Mensaje de éxito |
| A-02 | Consultar la fecha límite del cliente A en `/consulta` | Fecha e insignia `pendiente` |
| A-03 | Agendar cita del cliente A desde `/agendar` | Resumen con instrucciones de pago |
| A-04 | Desde el panel, agendar al cliente B en una hora que empiece 15 minutos después de la cita de A | Rechazo por cruce |
| A-05 | Agendar al cliente B exactamente al terminar la cita de A | Cita creada |
| A-06 | Registrar pago de consulta de 49 000 para A | Pago pendiente; el trámite no avanza |
| A-07 | Intentar registrar la revisión de B (sin pago) | La acción no aparece en el panel; por API responde 409 |
| A-08 | Registrar pago de 50 000 para A | Estado "Primera consulta pagada" |
| A-09 | Registrar revisión "Debe declarar" para A | Estado "Debe declarar" |
| A-10 | Registrar pago de servicio de 299 000 para A | Pago pendiente |
| A-11 | Registrar pago de servicio de 300 000 para A | Estado "Servicio pagado" |
| A-12 | Iniciar trámite de A | Estado "En proceso" |
| A-13 | Registrar pago de consulta de 60 000 para B y aprobarlo en "Pagos en revisión" | B pasa a "Primera consulta pagada" |
| A-14 | Registrar revisión "No debe declarar" para B | Estado cerrado; la acción "Registrar pago del servicio" no aparece |
| A-15 | Fijar fecha manual de hoy al cliente C y consultar | Insignia "Vence hoy" |
| A-16 | Consultar al cliente D (cédula terminada en 05, calendario de demostración) | Insignia "Fecha vencida" |
| A-17 | Cerrar el navegador, abrir de nuevo el panel y revisar A y B | Los datos persisten |
| A-18 | Abrir `/contador` en una ventana privada | Redirección al login |

### 14.5 Datos de prueba para la aceptación

| Cliente | Cédula | Teléfono | Rango de demostración |
|---|---|---|---|
| A | `1004567849` | `3001234567` | 40 a 59 (pendiente, +10 días) |
| B | `1004567890` | `3009876543` | 80 a 99 (pendiente, +60 días) |
| C | `1004567862` | `3012223344` | 60 a 79 (pendiente; se fija fecha manual) |
| D | `1004567805` | `3015556677` | 0 a 19 (vencida, -10 días) |

---

## 15. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Preparación | P00 | `ESTADO_ACTUAL.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; compilación de base verificada | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1, M2 y M3 aplicadas; `npm run db:verificar` en verde | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas`, 36 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión del contador, respuestas, esquemas, formato; `/api/contador/sesion` protegido | `FASE_3_COMPLETADA.md` |
| 4 · Datos y casos de uso | P04, P05 | `lib/datos/*`, `dataService`; `npm run probar:flujo` en verde | `FASE_4_COMPLETADA.md` |
| 5 · Módulo público | P06, P07 | API pública y pantallas; `npm run probar:api` en verde | `FASE_5_COMPLETADA.md` |
| 6 · Panel del contador | P08, P09, P10, P11 | API del contador y panel completo | `FASE_6_COMPLETADA.md` |
| 7 · Aceptación | P12 | `ACEPTACION.md` con A-01 a A-18; README actualizado; despliegue verificado | `FASE_7_COMPLETADA.md` |
| 8 · Opcionales | P13, P14 | Sección 16 | `FASE_8_COMPLETADA.md` |

Condiciones entre fases:

- No se inicia una fase si la anterior no tiene su archivo de cierre.
- `npm run build` debe terminar sin errores al final de cada prompt.
- `npm test` debe pasar al final de cada prompt desde P02.
- Cada prompt termina con un commit del estudiante y un `git push`; Vercel despliega en cada push y un fallo de despliegue se corrige antes del siguiente prompt.

---

## 16. Funcionalidades opcionales

Se desarrollan solo con la fase 7 cerrada.

| Prompt | Funcionalidad (plan funcional) | Implementación |
|---|---|---|
| P13 | Filtrar clientes por estado | Selector de estado en `/contador/clientes` usando `?estado=`; enlaces desde el resumen |
| P13 | Mostrar clientes con fecha límite próxima | Tarjeta en el resumen con clientes cuya fecha efectiva está entre hoy y 15 días, excluyendo `no_debe_declarar` y `en_proceso` |
| P13 | Historial de citas y revisiones | Línea de tiempo en el detalle del cliente a partir de `eventos_cliente`, con etiquetas legibles por tipo de evento |
| P14 | Calendario general de citas | Vista semanal en `/contador/agenda` (columnas de lunes a viernes, filas cada 30 minutos) con alternancia entre vista de día y de semana |
| P14 | Observaciones adicionales del contador | Tabla `notas_cliente` (id, cliente_id, texto, created_at), formulario y lista en el detalle |
| P14 | Correo de confirmación de cita | Envío con Resend al agendar (cliente o contador): fecha, hora, valor e instrucciones de pago. Variable `RESEND_API_KEY`. Si falla el envío, la cita se conserva y el error se registra en consola |

---

## 17. Glosario

| Término | Definición |
|---|---|
| Trámite | Proceso de un cliente desde el registro hasta el inicio de la declaración o el cierre |
| Primera consulta | Cita de 30 minutos por $50.000 en la que el contador revisa la situación tributaria |
| Servicio completo | Elaboración de la declaración por $300.000, solo si el cliente debe declarar |
| Fecha límite efectiva | Fecha manual del contador si existe; si no, la del calendario tributario vigente |
| Calendario tributario | Rangos de los dos últimos dígitos del NIT o cédula con su fecha de vencimiento |
| Año gravable | Año cuyos ingresos se declaran; se declara al año siguiente |
| Pago en revisión | Pago con monto mayor al esperado, pendiente de decisión del contador |
| Evento | Registro en `eventos_cliente` de cada cambio del trámite |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
