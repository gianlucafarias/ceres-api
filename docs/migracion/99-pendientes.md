# 99 - Pendientes de migracion (legacy -> Nest)

## Modulos/Endpoints faltantes
- **Votante**: `GET /api/votante/:documento`, `POST /api/votante/importar`.
- **Certificados PDF**: `POST /api/crear-certificado` (static `/modified_certificates` ya disponible).

## Compatibilidad legacy a revisar
- **Reclamos**: rutas singulares (`/api/reclamo/:id`, `/api/reclamo/crear`, prioridad, delete), `reclamos/telefono/:telefono`, `GET /api/status`.
- **Interacciones**: `GET /api/interactions/last-week/count` (sin parametros) de `userRoutes`.

## Encuestas
- Endpoints de salud/integridad: `/api/encuestaobras/salud`, `/salud/historial`, `/salud/integridad`.
- Procesamiento **Redis + background processor** (legacy) pendiente.

## Infra parity
- Jobs/Cron: notificaciones diarias (legacy) y otros background jobs.
