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
OBS_STACK_ENABLED=false
OPS_ALERTS_ENABLED=false
OPS_ALERT_MIN_SEVERITY=error
OPS_ALERT_THROTTLE_SECONDS=300
OPS_ALERT_TIMEOUT_MS=3000
OPS_SLACK_WEBHOOK_URL=
OPS_SLACK_BOT_NAME=
OPS_SLACK_CHANNEL=
OBS_DEFAULT_METRICS_ENABLED=true
OBS_METRICS_PREFIX=ceres_api_
OBS_REQUEST_LOG_SAMPLE_RATE=0
OBS_REQUEST_LOG_5XX_ENABLED=true
OBS_PROMETHEUS_HOST_PORT=9091
OBS_PROMETHEUS_SCRAPE_INTERVAL=30s
OBS_GRAFANA_HOST_PORT=3003
OBS_GRAFANA_ADMIN_USER=admin
OBS_GRAFANA_ADMIN_PASSWORD=admin
OBS_PROMETHEUS_IMAGE=ghcr.io/gianlucafarias/ceres-prometheus:v2.51.1
OBS_GRAFANA_IMAGE=ghcr.io/gianlucafarias/ceres-grafana:10.2.3
```

Tambien se soporta compatibilidad con variables legacy:

- `SLACK_WEBHOOK_URL` (fallback si no existe `OPS_SLACK_WEBHOOK_URL`)
- `SLACK_BOT_NAME` y `SLACK_CHANNEL`

Defaults pensados para produccion segura:

- Slack desactivado por defecto.
- Logs muestreados desactivados por defecto (`sample=0`).
- Solo eventos `error` y `critical` generan alerta (por defecto).

## Stack opcional (Prometheus + Grafana)

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml --profile observability up -d
```

- Prometheus (host local VPS): `http://127.0.0.1:9091`
- Grafana (host local VPS): `http://127.0.0.1:3003`

Los puertos son configurables con:

- `OBS_PROMETHEUS_HOST_PORT`
- `OBS_GRAFANA_HOST_PORT`

El scrape de Prometheus usa internamente `api:3022` y autentica con `OPS_API_KEY`.
Las imagenes de Prometheus/Grafana se consumen desde GHCR para evitar rate-limit de Docker Hub en el VPS.

Para producción en VPS:

1. setear `OBS_STACK_ENABLED=true` en `.env`
2. ejecutar deploy (manual o GitHub Actions)
3. acceder por SSH tunnel (recomendado), por ejemplo:

```bash
ssh -L 3003:127.0.0.1:3003 -L 9091:127.0.0.1:9091 user@tu-vps
```

Luego abrir local:

- Grafana: `http://127.0.0.1:3003`
- Prometheus: `http://127.0.0.1:9091`

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
