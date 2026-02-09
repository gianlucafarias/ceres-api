# 25 - Dashboard Ceresito Summary

## Objetivo

Reducir overfetch en la carga inicial del dashboard Ceresito consolidando los KPIs del header en un unico endpoint.

## Endpoint

- `GET /api/v1/dashboard/ceresito/summary`
- Auth: `ADMIN_API_KEY` por header `x-api-key` (o `?api_key=` por guard comun).

## Query

- `from` (ISO, opcional)
- `to` (ISO, opcional)
- `treatedStatus` (opcional, default `ASIGNADO`)

Si `from` y/o `to` no se envian, se usa una ventana por defecto de 90 dias hasta fin de dia actual.

## Respuesta

```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-11-09T00:00:00.000Z",
      "to": "2026-02-09T23:59:59.999Z",
      "timezone": "America/Argentina/Cordoba"
    },
    "kpis": {
      "uniqueUsers": 0,
      "conversations": 0,
      "messagesSent": 0,
      "claimsReceived": 0,
      "claimsTreated": 0
    },
    "meta": {
      "treatedStatus": "ASIGNADO",
      "generatedAt": "2026-02-09T14:00:00.000Z"
    }
  }
}
```

## Criterios

- Unifica 5 llamados del header en 1.
- Mantiene endpoints existentes para compatibilidad.
- Devuelve `0` (no `null`) cuando no hay datos.
- `400` en fechas invalidas (validacion DTO).
- No incluye healthcheck (`/api/v1/health` se mantiene separado).

## Cache

Se agrega cache en Redis para este endpoint:

- Key: `dashboard:ceresito:summary:<from>:<to>:<treatedStatus>`
- TTL configurable por `DASHBOARD_CERESITO_CACHE_TTL_SECONDS` (default `60`).
- Si Redis no esta configurado, funciona sin cache.

## Implementacion

- `src/modules/dashboard-ceresito/dashboard-ceresito.module.ts`
- `src/modules/dashboard-ceresito/dashboard-ceresito.controller.ts`
- `src/modules/dashboard-ceresito/dashboard-ceresito.service.ts`
- `src/modules/dashboard-ceresito/dto/dashboard-ceresito-summary.dto.ts`
