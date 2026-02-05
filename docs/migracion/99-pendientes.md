# 99 - Pendientes de migraciÃ³n (legacy â†’ Nest)

## MÃ³dulos/Endpoints faltantes
- **Votante**: `GET /api/votante/:documento`, `POST /api/votante/importar`.
- **Certificados PDF**: `POST /api/crear-certificado` + static `/modified_certificates`.

## Compatibilidad legacy a revisar
- **Reclamos**: rutas singulares (`/api/reclamo/:id`, `/api/reclamo/crear`, prioridad, delete), `reclamos/telefono/:telefono`, `GET /api/status`.
- **Interacciones**: `GET /api/interactions/last-week/count` (sin parÃ¡metros) de `userRoutes`.

## Encuestas
- Endpoints de salud/integridad: `/api/encuestaobras/salud`, `/salud/historial`, `/salud/integridad`.
- Procesamiento **Redis + background processor** (hoy se guarda directo en Postgres).

## Infra parity
- Rate limiting general + estricto para encuestas.
- ValidaciÃ³n de `Content-Type` en POST.
- Manejo de JSON malformado (middleware de seguridad).
- Static legacy: `/media/poda`.
- Jobs/Cron: notificaciones diarias (legacy) y otros background jobs.
