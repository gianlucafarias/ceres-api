# 99 - Pendientes de migracion (legacy -> Nest)

## Modulos/Endpoints cerrados en fase actual

- **Votante**:
  - `GET /api/v1/votante/:documento`
  - `POST /api/v1/votante/importar` (admin)
- **Certificados PDF**:
  - `POST /api/v1/certificados/crear`
- **Reclamos para bot**:
  - `GET /api/v1/reclamos/tipos`
  - `GET /api/v1/reclamos/bot/ultimo?telefono=...`

## Pendientes actuales

- **Idempotencia reclamos**:
  - `POST /api/v1/reclamos` con `Idempotency-Key` para despliegue multi-instancia.

## Compatibilidad legacy a revisar

- **Reclamos**: rutas singulares (`/api/reclamo/:id`, `/api/reclamo/crear`, prioridad, delete), `GET /api/status`.
- **Reclamos (dashboard sin PII)**: usar `GET /api/v1/reclamos/:id/relacionados` en lugar de flujos por telefono en cliente.
- **Interacciones**: `GET /api/interactions/last-week/count` (sin parametros) de `userRoutes`.

## Encuestas

- Endpoints de salud/integridad: `/api/encuestaobras/salud`, `/salud/historial`, `/salud/integridad`.
- Procesamiento **Redis + background processor** (legacy) pendiente.

## Infra parity

- Jobs/Cron: notificaciones diarias (legacy) y otros background jobs.
