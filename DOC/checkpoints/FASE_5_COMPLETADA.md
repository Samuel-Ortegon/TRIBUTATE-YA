# Fase 5 · API y módulo público

Fecha de cierre: 2026-11-07

Se implementaron las rutas públicas para registro, consulta de fecha límite, disponibilidad, agendamiento, consulta de cita y cancelación. También se implementaron las páginas `/`, `/registro`, `/consulta` y `/agendar`.

## Prueba de API

Comando: `npm run probar:api` con la aplicación local iniciada.

```text
OK    Paso 1 · Registrar cliente válido
OK    Paso 2 · Rechazar cédula duplicada
OK    Paso 3 · Rechazar registro sin autorización de datos
OK    Paso 4 · Consultar fecha límite del cliente
OK    Paso 5 · Rechazar cédula inexistente
OK    Paso 6 · Encontrar fecha con horarios disponibles
OK    Paso 7 · Rechazar últimos cuatro dígitos incorrectos
OK    Paso 8 · Agendar con verificación correcta
OK    Paso 9 · Rechazar segunda cita activa
OK    Paso 10 · Consultar mi cita sin exponer identificadores
OK    Paso 11 · Cancelar mi cita
OK    Paso 12 · Confirmar que ya no hay cita activa
eventos_cliente: 3
revisiones: 0
pagos: 0
citas: 1
clientes: 1
Total de fallas: 0
```

La prueba verificó previamente que las cédulas reservadas no existieran y eliminó únicamente los registros creados durante esta ejecución.

Smoke web: portada, registro, consulta y agenda HTTP 200; la página de agenda se revisó en el navegador.

Validaciones: `npm run build`, `npm test` y `npm run type-check` -> correctos.
