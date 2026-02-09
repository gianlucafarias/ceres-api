# Observabilidad operativa (v2)

Esta API ahora expone observabilidad nativa con enfoque de bajo impacto:

- metricas Prometheus protegidas.
- alertas operativas por Slack (opt-in).
- endpoint central para eventos desde dashboard, bot, servicios y futuras integraciones.

## Endpoints

- `GET /api/v1/ops/metrics` (protegido por `OPS_API_KEY` o `ADMIN_API_KEY` fallback).
- `POST /api/v1/ops/notifications/events` (protegido por `OPS_EVENTS_API_KEYS` o fallback keys).

## Variables

```dotenv
OPS_API_KEY=
OPS_EVENTS_API_KEYS=
OPS_ALERTS_ENABLED=false
OPS_ALERT_MIN_SEVERITY=error
OPS_ALERT_THROTTLE_SECONDS=300
OPS_ALERT_TIMEOUT_MS=3000
OPS_SLACK_WEBHOOK_URL=
OBS_DEFAULT_METRICS_ENABLED=true
OBS_METRICS_PREFIX=ceres_api_
OBS_REQUEST_LOG_SAMPLE_RATE=0
OBS_REQUEST_LOG_5XX_ENABLED=true
```

Defaults pensados para produccion segura:

- Slack desactivado por defecto.
- Logs muestreados desactivados por defecto (`sample=0`).
- Solo eventos `error` y `critical` generan alerta (por defecto).

## Stack opcional (Prometheus + Grafana)

```bash
cd ops/observability
docker compose -f docker-compose.observability.yml up -d
```

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (`admin/admin`)

Antes de usar, ajustar `ops/observability/prometheus.yml`:

- `targets` con host/puerto reales del backend.
- `api_key` con una key valida para `GET /api/v1/ops/metrics`.

## Ejemplo de evento externo

```json
{
  "source": "dashboard",
  "type": "legacy_fallback",
  "severity": "warn",
  "title": "Fallback a legacy",
  "message": "Timeout contra core principal",
  "metadata": {
    "provider": "legacy-core",
    "route": "/api/core/feedback"
  }
}
```

La API responde `202` y procesa Slack en segundo plano.
