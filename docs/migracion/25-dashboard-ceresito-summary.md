# 25 - Dashboard Ceresito Summary

## Objetivo

Reducir overfetch en la carga inicial del dashboard Ceresito consolidando los KPIs del header en un unico endpoint.

## Endpoint

- `GET /api/v1/dashboard/ceresito/summary`
- Auth: `ADMIN_API_KEY` por header `x-api-key` (o `?api_key=` por guard comun).

## Query

- `from` (ISO, opcional)
- `to` (ISO, opcional)
- `treatedStatus` (opcional, default `ASIGNADO` para compatibilidad con metricas tratadas)

Si `from` y/o `to` no se envian, se usa una ventana por defecto de 90 dias hasta fin de dia actual.

## Respuesta

```json
{
  "uniqueUsers": 0,
  "conversations": 0,
  "sentMessages": 0,
  "claimsReceived": 0,
  "claimsHandled": 0,
  "generatedAt": "2026-02-09T14:00:00.000Z"
}
```

## Criterios

- Reemplaza 5 requests actuales del header por 1 request agregado.
- Mantiene endpoints actuales para compatibilidad.
- Devuelve `0` (no `null`) cuando no hay datos.
- `400` en fechas invalidas (DTO + validacion global).
- No incluye healthcheck (`/api/v1/health` se mantiene separado).

## Cache

Se agrega cache en Redis para este endpoint:

- Key: `dashboard:ceresito:summary:<from>:<to>:<treatedStatus>`
- TTL configurable por `DASHBOARD_CERESITO_CACHE_TTL_SECONDS` (default `60`).
- Si Redis no esta disponible, responde igual sin cache.

## Implementacion

- `src/modules/dashboard-ceresito/dashboard-ceresito.module.ts`
- `src/modules/dashboard-ceresito/dashboard-ceresito.controller.ts`
- `src/modules/dashboard-ceresito/dashboard-ceresito.service.ts`
- `src/modules/dashboard-ceresito/dto/dashboard-ceresito-summary.dto.ts`
- `test/dashboard-ceresito-summary.e2e-spec.ts`
