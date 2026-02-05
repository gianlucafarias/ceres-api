# 08 - Módulo Reclamos (sin PDF)

## Alcance
- Crea/consulta reclamos desde bot/ciudadano.
- Gestión completa desde dashboard (listado, detalle, actualización, historial, stats básicas).
- PDFs y estadísticas avanzadas quedan para fase siguiente.

## Seguridad
- Bot/Ciudadano: `BOT_API_KEY` (header `x-api-key` o `?api_key=`).
- Dashboard: `ADMIN_API_KEY`.
- PII: el teléfono solo se devuelve en endpoints admin. Respuestas bot excluyen `telefono`.

## Endpoints (v1)
### Bot (`BOT_API_KEY`)
- `POST /api/v1/reclamos` (crear) → id, estado, fecha, reclamo, barrio, ubicacion (sin teléfono).
- `GET /api/v1/reclamos/:id/estado` → estado y datos básicos (sin teléfono).

### Dashboard (`ADMIN_API_KEY`)
- `GET /api/v1/reclamos` (paginado, filtros estado/prioridad/barrio/fecha/search, sort/order).
- `GET /api/v1/reclamos/:id` (detalle completo, incluye teléfono).
- `PATCH /api/v1/reclamos/:id` (estado, prioridad, cuadrilla, detalle, ubicacion).
- `GET /api/v1/reclamos/:id/historial`
- `GET /api/v1/reclamos/estadisticas/basicas` (por estado, prioridad y tipo).

## Estructura
- `src/modules/reclamos/`
  - `reclamos.module.ts`
  - `reclamos.service.ts`
  - `reclamos.bot.controller.ts`
  - `reclamos.admin.controller.ts`
  - `dto/reclamos-bot.dto.ts`
  - `dto/reclamos-admin.dto.ts`
  - `reclamos.service.spec.ts`

## Notas
- Se conserva la entidad `Reclamo` y `ReclamoHistorial`.
- Paginación obligatoria en listados admin.
- Historial registra cambios de estado, prioridad y cuadrilla; usa `usuarioId` si se envía.
- Se registra activity_log para creacion y cambios de estado (dashboard) con entityType = reclamo.
- Geocoding se intenta al crear o cambiar ubicación; si falla se registra pero no detiene el flujo.
- Versionado URI `v1`.

## Relacionados
- Ver `09-reclamos-pdf.md` (PDFs).
- Ver `10-reclamos-estadisticas.md` (estadísticas avanzadas).

