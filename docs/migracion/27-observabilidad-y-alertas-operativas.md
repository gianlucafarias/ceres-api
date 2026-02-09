# 27 - Observabilidad y alertas operativas

## Objetivo

Agregar observabilidad util para produccion sin romper contratos existentes y con bajo impacto en VPS:

- metricas HTTP y operativas para scraping.
- endpoint centralizado para eventos/alertas de bot, dashboard, plataforma de servicios y futuros consumidores.
- notificaciones Slack con control de ruido (throttle + severidad minima).

## Endpoints nuevos (v1)

### GET /api/v1/ops/metrics

- Exposicion Prometheus.
- Auth: `OPS_API_KEY` en `x-api-key` o `?api_key=`.
- Fallback de auth: si `OPS_API_KEY` no esta seteada, usa `ADMIN_API_KEY`.
- Respuesta: `text/plain` (formato Prometheus).

### POST /api/v1/ops/notifications/events

- Ingestion centralizada de eventos operativos.
- Auth:
  - preferente: `OPS_EVENTS_API_KEYS` (lista CSV).
  - fallback: `OPS_API_KEY` / `ADMIN_API_KEY` / `BOT_API_KEY`.
- Respuesta: `202 Accepted` con `{ "accepted": true }`.
- Contrato de entrada:

```json
{
  "source": "dashboard",
  "type": "legacy_fallback",
  "severity": "warn",
  "title": "Fallback a legacy",
  "message": "Timeout contra core",
  "fingerprint": "dashboard-fallback-core-timeout",
  "occurredAt": "2026-02-09T14:00:00.000Z",
  "metadata": { "provider": "legacy-core" }
}
```

`source` y `type` son tokens controlados (sin espacios), `severity` soporta `info|warn|error|critical`.

## Slack alerts

Las alertas son asincronas y no bloquean la respuesta HTTP.

- Flag principal: `OPS_ALERTS_ENABLED` (default `false`).
- Webhook: `OPS_SLACK_WEBHOOK_URL`.
- Severidad minima: `OPS_ALERT_MIN_SEVERITY` (default `error`).
- Throttle por fingerprint: `OPS_ALERT_THROTTLE_SECONDS` (default `300`).
- Timeout de envio: `OPS_ALERT_TIMEOUT_MS` (default `3000`).

Si Redis esta disponible, el throttle es distribuido. Si no, usa fallback en memoria.

## Instrumentacion HTTP

Se agrega middleware global:

- `x-request-id` (si no viene, se genera).
- metricas por request (metodo/ruta/status/latencia).
- evento interno automatico ante `5xx` para alertado.
- logs JSON muestreados:
  - `OBS_REQUEST_LOG_SAMPLE_RATE` (0 a 1, default `0`).
  - `OBS_REQUEST_LOG_5XX_ENABLED` (default `true`).

## Seguridad y carga

- No se alteran endpoints actuales del negocio.
- Endpoints de observabilidad protegidos por API keys.
- Slack deshabilitado por default (opt-in).
- Logs de alto volumen deshabilitados por default (sample rate `0`).
- Metadata sensible (telefono, dni, email, tokens, passwords, api keys) se enmascara antes de enviar a Slack.

## Archivos clave

- `src/modules/observability/observability.module.ts`
- `src/modules/observability/ops-metrics.controller.ts`
- `src/modules/observability/ops-notifications.controller.ts`
- `src/modules/observability/metrics.service.ts`
- `src/modules/observability/ops-notifications.service.ts`
- `src/modules/observability/observability.middleware.ts`
- `src/common/guards/ops-api-key.guard.ts`
- `src/common/guards/ops-events-api-key.guard.ts`
