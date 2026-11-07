# Fase 4 · Datos y casos de uso

Fecha de cierre: 2026-11-07

Se implementó el acceso a datos transaccional para clientes, agenda, calendario, pagos, revisiones y trámites. La fachada `src/lib/dataService.ts` es el punto de entrada para las páginas y rutas del módulo.

## Prueba de flujo

Comando: `npm run probar:flujo`

```text
OK    Paso 1 · Registrar cliente 1
OK    Paso 2 · Rechazar cédula duplicada
OK    Paso 3 · Agendar primera hora disponible
OK    Paso 4 · Rechazar cruce de horario
OK    Paso 5 · Rechazar segunda cita activa
OK    Paso 6 · Rechazar revisión sin pago
OK    Paso 7 · Registrar pago de consulta insuficiente
OK    Paso 8 · Confirmar pago exacto de consulta
OK    Paso 9 · Registrar revisión y cerrar cita
OK    Paso 10 · Rechazar inicio sin pago de servicio
OK    Paso 11 · Registrar pago de servicio insuficiente
OK    Paso 12 · Confirmar pago exacto del servicio
OK    Paso 13 · Iniciar trámite habilitado
OK    Paso 14 · Verificar detalle completo
eventos_cliente: 11
revisiones: 1
pagos: 4
citas: 1
clientes: 2
Total de fallas: 0
```

La prueba verificó previamente que las cédulas de prueba no existieran. La limpieza final borró exclusivamente esos registros de prueba.

Validaciones: `npm run build`, `npm test` y `npm run type-check` -> correctos.
