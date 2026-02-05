# 14 - Amelia Turnos

## Objetivo
Migrar el webhook de Amelia Booking y la gestion de turnos/licencias.

## Acceso
- `POST /api/v1/webhook/amelia`: publico, **protegido por AMELIA_WEBHOOK_SECRET**.
  - Token aceptado en:
    - Header `Authorization: Bearer <token>`
    - Query `?token=<token>`
    - Body `token`
- Endpoints administrativos: **ADMIN_API_KEY**.

## Endpoints
- `POST /api/v1/webhook/amelia`
  - Procesa payload, crea/actualiza turno, loggea actividad y envia WhatsApp.
- `GET /api/v1/turnos-licencia/telefono/:telefono`
- `GET /api/v1/turnos-licencia/amelia/:ameliaBookingId`
- `GET /api/v1/turnos-licencia/:id`
- `PATCH /api/v1/turnos-licencia/:id/estado`
  - Body: `{ estado, usuarioId? }`
- `POST /api/v1/turnos-licencia/reintentar-notificaciones`
  - Body: `{ maxIntentos? }`

## WhatsApp
- Se usan templates:
  - `WHATSAPP_TEMPLATE_TURNO_LICENCIA` (default `turno_licencia_confirmado`)
  - `WHATSAPP_TEMPLATE_TURNO_CANCELADO` (default `turno_licencia_cancelado`)

## Notas
- Se guarda el payload (sin `token`) en `metadata` para auditoria.
- No hay cron automatico: el reintento de notificaciones es manual.

## Postman
- Nueva carpeta **Amelia** con ejemplos de cada endpoint.

