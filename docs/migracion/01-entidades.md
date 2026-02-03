# 01 - Entidades y mapeo a tablas existentes

Base: Postgres (schema público). Se importaron todas las entidades del backend Express sin cambiar nombres de tabla ni columnas.

| Entidad (Nest) | Tabla | PK | Relaciones clave |
| --- | --- | --- | --- |
| `Contact` | `contact` | id | 1:N `History`, FK en `PreferenciasUsuario` |
| `History` | `history` | id | N:1 `Contact` (contact_id) |
| `Converstation` | `conversaciones` | id | — |
| `Flow` | `visitas_flujo` | id | — |
| `ActivityLog` | `activity_log` | id | — |
| `Reclamo` | `reclamos` | id | — |
| `ReclamoHistorial` | `reclamo_historial` | id | N:1 `Reclamo` (reclamo_id) |
| `PreferenciasUsuario` | `preferencias_usuario` | id | N:1 `Contact` (contact_id) |
| `Notificaciones` | `notificaciones` | id | — |
| `EncuestaPresupuesto` | `encuesta_presupuesto` | id | — |
| `Feedback` | `feedback` | id | N:1 `Contact` (contact_id) |
| `Votante` | `votante` | id | — |
| `BotConfig` | `bot_config` | id | — |
| `AmeliaTurno` | `amelia_turnos` | id | índices en `telefono`, `fechaTurno`, único `ameliaBookingId` |
| `Pharmacy` | `pharmacies` | code (PK) | — |
| `DutySchedule` | `duty_schedule` | date (PK) | N:1 `Pharmacy` (pharmacy_code), eager |

Notas de tipos:
- `numeric` se mantiene como `type: 'numeric'` (para lat/lng en `Reclamo`).
- `jsonb` se usa en `Contact.values`, `History.options`, `EncuestaPresupuesto` arrays, `ActivityLog.metadata`, etc.
- Timestamps mantienen nombres originales (`created_at`, `updated_in`, etc.).

Validación recomendada
- Ejecutar `SELECT 1` desde healthcheck (listo).
- Para revisar divergencias: `npm run typeorm:schema-log` (pendiente de script) o consultas a `information_schema.columns`.
