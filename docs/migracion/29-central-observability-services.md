# Observabilidad central y email service multi-servicio

## Objetivo

Centralizar en `ceres-api` dos responsabilidades compartidas:

- timeline auditable multi-servicio
- envio de emails template-based con Redis como backend de cola

En esta fase `plataforma-servicios-ceres` sigue conservando su `AuditEvent`
local como fuente de verdad operativa, pero emite una copia central en modo
`best effort`.

## Arquitectura

```text
plataforma-servicios-ceres
  ├─ guarda AuditEvent local
  ├─ POST /api/v1/ops/events --------------> ceres-api
  └─ POST /api/v1/ops/jobs/email ---------> ceres-api
                                              ├─ guarda ops_event_log
                                              ├─ encola job en Redis
                                              └─ envia email por Resend/SMTP
```

## Storage central

Tabla nueva: `ops_event_log`

Campos principales:

- `id`
- `source`
- `kind`
- `domain`
- `event_name`
- `entity_type`
- `entity_id`
- `actor_type`
- `actor_id`
- `actor_label`
- `actor_email`
- `actor_role`
- `request_id`
- `route`
- `path`
- `method`
- `status`
- `duration_ms`
- `summary`
- `changes`
- `metadata`
- `occurred_at`
- `ingested_at`

No reutiliza `activity_log`.

## Endpoints

### Observabilidad central

- `POST /api/v1/ops/events`
- `GET /api/v1/ops/events`
- `GET /api/v1/ops/events/:id`
- `GET /api/v1/ops/summary`

Auth:

- ingest (`POST /ops/events`): `OPS_EVENTS_API_KEYS`
- lectura (`GET /ops/*`): `OPS_API_KEY` o fallback `ADMIN_API_KEY`

### Jobs de email

- `POST /api/v1/ops/jobs/email`

Contrato:

- `templateKey`
- `recipient`
- `payload`
- `source`
- `requestId`
- `entityType`
- `entityId`
- `actor`
- `idempotencyKey`
- `providerStrategy` opcional

## Templates iniciales

- `services.email_verification`
- `services.professional_approved`
- `services.password_reset`
- `services.verification_resend`

La API cliente no envia HTML arbitrario ni credenciales.

## Providers

`ceres-api` resuelve providers asi:

1. `resend-first` por defecto
2. fallback a SMTP si esta configurado

Variables relevantes:

- `RESEND_API_KEY`
- `SERVICES_EMAIL_FROM`
- `EMAIL_FROM_DEFAULT`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`

## Cola Redis

Redis queda solamente en `ceres-api`.

Claves usadas:

- `ops:email:pending`
- `ops:email:processing`
- `ops:email:dead_letter`
- `ops:email:idempotency:*`
- `ops:summary:*`

Configuracion:

- `OPS_EMAIL_QUEUE_POLL_MS`
- `OPS_EMAIL_MAX_ATTEMPTS`
- `OPS_EMAIL_IDEMPOTENCY_TTL_SECONDS`
- `OPS_SUMMARY_CACHE_TTL_SECONDS`

## Criterio de ownership

- El servicio emisor decide la regla de negocio: enviar, saltear o no encolar.
- `ceres-api` ejecuta el trabajo tecnico: cola, provider, fallback y trazabilidad central.
- `activity_log` legacy sigue intacto y no participa en esta capa.

## Despliegue

- no cambia puertos
- no cambia `docker-compose` runtime de `plataforma-servicios-ceres`
- no agrega Redis nuevo en plataforma
- requiere migracion TypeORM nueva en `ceres-api`
