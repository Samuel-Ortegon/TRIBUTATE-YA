# Aceptación manual del módulo

Esta lista verifica los flujos principales de Tributate Ya. Ejecútala en el despliegue de Vercel después de iniciar sesión con una cuenta autorizada para las pruebas que requieren el panel. Completa **Resultado obtenido**, **Evidencia** y **Observación** en cada fila; no marques como aprobada una prueba que no se haya ejecutado.

## Ejecución del 2026-11-14

Se ejecutaron los 18 casos por HTTP contra el despliegue de producción `b881820`, con clientes ficticios de esta guía y un usuario temporal de contador. A-07 comprobó la lista de acciones devuelta al panel y el rechazo de la API; A-17 comprobó la persistencia tras iniciar una segunda sesión. Al final se eliminaron los cuatro clientes ficticios y el usuario temporal. Esta evidencia es funcional/API; no sustituye una revisión visual manual del panel.

Para repetir la prueba desde cero, confirma primero que los datos indicados sean únicamente datos de prueba y luego ejecuta:

```powershell
npm run db:limpiar -- 1004567849 1004567890 1004567862 1004567805
```

| Cliente | Cédula | Teléfono | Escenario del calendario demo |
|---|---|---|---|
| A | `1004567849` | `3001234567` | Dígitos 40–59, vencimiento pendiente |
| B | `1004567890` | `3009876543` | Dígitos 80–99 |
| C | `1004567862` | `3012223344` | Dígitos 60–79; se fija fecha manual |
| D | `1004567805` | `3015556677` | Dígitos 0–19, vencimiento vencido |

| ID | Acción | Resultado esperado | Resultado obtenido | Evidencia | Observación |
|---|---|---|---|---|---|
| A-01 | Registrar al cliente A desde `/registro` | Mensaje de éxito | Aprobado: registro HTTP 201 | Producción: `POST /api/publico/clientes` | Cliente ficticio eliminado al terminar |
| A-02 | Consultar la fecha límite del cliente A en `/consulta` | Fecha e insignia `pendiente` | Aprobado: estado `pendiente` | Producción: `POST /api/publico/fecha-limite` | Calendario demo |
| A-03 | Agendar cita del cliente A desde `/agendar` | Resumen con instrucciones de pago | Aprobado: cita creada | Producción: `POST /api/publico/citas` | Se usó horario disponible |
| A-04 | Desde el panel, agendar al cliente B 15 minutos después del inicio de la cita de A | Rechazo por cruce | Aprobado: HTTP 409 `CITA_CRUCE_HORARIO` | Producción: `POST /api/contador/citas` | Conflicto de 15 minutos |
| A-05 | Agendar al cliente B exactamente cuando termina la cita de A | Cita creada | Aprobado: HTTP 201 | Producción: `POST /api/contador/citas` | Horario contiguo permitido |
| A-06 | Registrar un pago de consulta de $49.000 para A | Pago pendiente; el trámite no avanza | Aprobado: estado `pendiente` | Producción: `POST /api/contador/pagos` |  |
| A-07 | Intentar registrar la revisión de B, que no tiene pago | Acción no disponible en el panel y HTTP 409 por API | Aprobado: acción ausente y API HTTP 409 | Producción: `GET /api/contador/clientes/{id}` y `POST /api/contador/revisiones` | Verificación de contrato/API, no visual |
| A-08 | Registrar un pago de $50.000 para A | Estado «Primera consulta pagada» | Aprobado: pago confirmado | Producción: `POST /api/contador/pagos` |  |
| A-09 | Registrar para A la revisión «Debe declarar» | Estado «Debe declarar» | Aprobado: revisión registrada | Producción: `POST /api/contador/revisiones` |  |
| A-10 | Registrar un pago de servicio de $299.000 para A | Pago pendiente | Aprobado: estado `pendiente` | Producción: `POST /api/contador/pagos` |  |
| A-11 | Registrar un pago de servicio de $300.000 para A | Estado «Servicio pagado» | Aprobado: pago confirmado | Producción: `POST /api/contador/pagos` |  |
| A-12 | Iniciar el trámite de A | Estado «En proceso» | Aprobado: estado `en_proceso` | Producción: `POST /api/contador/clientes/{id}/iniciar-tramite` |  |
| A-13 | Registrar para B un pago de consulta de $60.000 y aprobarlo desde «Pagos en revisión» | B pasa a «Primera consulta pagada» | Aprobado: pago listado, aprobado y confirmado | Producción: `/api/contador/pagos` | Aprobación con observación |
| A-14 | Registrar para B la revisión «No debe declarar» | Estado cerrado; no aparece la acción para registrar pago de servicio | Aprobado: estado cerrado y acción ausente | Producción: `POST /api/contador/revisiones` y `GET /api/contador/clientes/{id}` | Verificación de contrato/API, no visual |
| A-15 | Fijar para C la fecha límite de hoy y consultar | Insignia «Vence hoy» | Aprobado: estado `vence_hoy` | Producción: `PATCH /api/contador/clientes/{id}` y `POST /api/publico/fecha-limite` |  |
| A-16 | Consultar a D con el calendario de demostración | Insignia «Fecha vencida» | Aprobado: estado `vencida` | Producción: `POST /api/publico/fecha-limite` | Calendario demo |
| A-17 | Cerrar y volver a abrir el navegador; revisar A y B en el panel | Los datos persisten | Aprobado: datos recuperados en una segunda sesión autenticada | Producción: `GET /api/contador/clientes/{id}` | Verificación de persistencia/API, no visual |
| A-18 | Abrir `/contador` sin sesión | Redirección al login | Aprobado: redirección a `/login` | [Producción: `/contador`](https://tributate-2asy03aty-tributo1.vercel.app/contador) | Verificado el 2026-11-14 |
