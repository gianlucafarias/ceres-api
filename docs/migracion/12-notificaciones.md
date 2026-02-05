# 12 - Modulo Notificaciones

## Alcance
- Preferencias de recordatorios de residuos (humedos, secos, patio).
- Asignacion de seccion para residuos de patio.
- Ejecucion manual de notificaciones (sin cron).

## Seguridad
- `BOT_API_KEY`:
  - `POST /api/v1/preferencias`
  - `GET /api/v1/preferencias/:contactId`
- Publico:
  - `POST /api/v1/seccion`
- `ADMIN_API_KEY`:
  - `POST /api/v1/ejecutar-manual`
  - `POST /api/v1/whatsapp/template`

## Endpoints (v1)
- `POST /api/v1/preferencias`
- `GET /api/v1/preferencias/:contactId`
- `POST /api/v1/seccion`
- `POST /api/v1/ejecutar-manual`
- `POST /api/v1/whatsapp/template`

## Respuestas
- Se incluye `success: true` para compatibilidad con el bot.
- `preferencias` devuelve campos en snake_case y camelCase.

## Notas
- No se ejecutan cron/jobs automaticos en este servicio.
- El envio de WhatsApp se centraliza en `POST /api/v1/whatsapp/template`.
- `contact_id` refiere al `contact.id`.

## Cambios pendientes (bot)
- Agregar header `x-api-key: BOT_API_KEY` en llamadas a:
  - `POST /preferencias`
  - `GET /preferencias/:contactId`

## Cambios pendientes (dashboard)
- Reemplazar envio directo a `https://api.ceres.gob.ar/v1/template` por:
  - `POST {API_URL}/api/v1/whatsapp/template`
  - Header `x-api-key: ADMIN_API_KEY`
  - Mantener el mismo payload `{ number, template, languageCode, components }`.

## Estructura
- `src/modules/notificaciones/`
  - `notificaciones.module.ts`
  - `notificaciones.controller.ts`
  - `notificaciones.service.ts`
  - `dto/notificaciones.dto.ts`
  - `notificaciones.service.spec.ts`

## Pruebas
- `npm test -- notificaciones`

