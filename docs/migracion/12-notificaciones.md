# 12 - Modulo Notificaciones

## Alcance
- Preferencias de recordatorios de residuos (humedos, secos, patio).
- Asignacion de seccion para residuos de patio.
- Ejecucion manual de notificaciones (sin cron).

## Seguridad
- **Sin guardias por ahora** (pendiente definir accesos).

## Endpoints (v1)
- `POST /v1/preferencias`
- `GET /v1/preferencias/:contactId`
- `POST /v1/seccion`
- `POST /v1/ejecutar-manual`

## Respuestas
- Se incluye `success: true` para compatibilidad con el bot.
- `preferencias` devuelve campos en snake_case y camelCase.

## Notas
- No se ejecutan cron/jobs automaticos en este servicio.
- El envio de WhatsApp usa `https://api.ceres.gob.ar/v1/template` (como legacy).
- `contact_id` refiere al `contact.id`.

## Estructura
- `src/modules/notificaciones/`
  - `notificaciones.module.ts`
  - `notificaciones.controller.ts`
  - `notificaciones.service.ts`
  - `dto/notificaciones.dto.ts`
  - `notificaciones.service.spec.ts`

## Pruebas
- `npm test -- notificaciones`
