# Fase 8 · Opcionales y cierre

Fecha: 2026-11-14

## P13 · Opcionales A

- Filtro de clientes por estado combinado con búsqueda y conservado en la URL.
- Tarjeta de fechas límite entre hoy y los próximos 15 días, excluyendo estados que no requieren vencimiento activo.
- Historial del cliente con descripciones de eventos, actor y hora de Bogotá.

## P14 · Opcionales B

- Agenda semanal de lunes a viernes, con intervalos de 30 minutos según `HORARIO_ATENCION` y navegación entre semanas.
- Notas de contador con validación de 3 a 2000 caracteres, API protegida, evento de historial y limpieza de datos de prueba.
- Migración `20261004000003_notas_cliente.sql` aplicada; la tabla tiene RLS y permisos revocados para `anon` y `authenticated`.
- Confirmación de cita por Resend después de confirmar la transacción. Si el proveedor falla, la cita se conserva; sin `RESEND_API_KEY`, el envío se omite con aviso.

## Validación

- `npm.cmd test`: 58 pruebas aprobadas.
- `npm.cmd run build`: correcto.
- `npm.cmd run lint`: correcto.
- `npm.cmd run type-check`: correcto.
- `npm.cmd run db:migrar`: migración aplicada.
- `npm.cmd run db:verificar`: restricciones existentes y reglas de agenda correctas.
- La entrega real de correo requiere una clave de Resend válida y un remitente/dominio verificado; con `onboarding@resend.dev`, el destinatario debe ser la dirección propietaria de la cuenta.
- Los cambios son locales y aún no están publicados en Vercel. No se creó el usuario contador pospuesto ni se hizo commit/push.
