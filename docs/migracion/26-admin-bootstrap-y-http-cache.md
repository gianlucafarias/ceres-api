# 26 - Admin Bootstrap y HTTP Cache

## Objetivo

- Exponer datos de bootstrap para settings del dashboard en un endpoint admin unico.
- Reducir lecturas repetitivas con soporte de cache HTTP condicional (`ETag`/`304`) en endpoints de baja volatilidad.

## Endpoint nuevo

### GET /api/v1/admin/bootstrap

- Auth: `ADMIN_API_KEY` por header `x-api-key` (o `?api_key=` por guard comun).
- Respuesta:

```json
{
  "tipoReclamos": ["Bache", "Luminaria"],
  "roles": ["ADMIN", "OPERADOR"],
  "users": [1, 2, 3]
}
```

Notas:

- `tipoReclamos`: valores distintos de `reclamos.reclamo` sin vacios.
- `roles`: desde `ADMIN_BOOTSTRAP_ROLES` (default `ADMIN`).
- `users`: union deduplicada de IDs detectados en `reclamo_historial.usuario_id` y `activity_log.user_id`.

## HTTP Cache (ETag/304)

Se agrega validacion condicional con `ETag` en:

- `GET /api/v1/feedback`
- `GET /api/v1/visitas-flujo`
- `GET /api/v1/contacts/last-interactions`

Comportamiento:

- Si el payload no cambia, respondera `304 Not Modified` cuando el cliente envie `If-None-Match`.
- Se incluye `Cache-Control: private, max-age=0, must-revalidate`.
- No se modifica el contrato JSON cuando responde `200`.

## Implementacion

- `src/modules/admin-bootstrap/admin-bootstrap.module.ts`
- `src/modules/admin-bootstrap/admin-bootstrap.controller.ts`
- `src/modules/admin-bootstrap/admin-bootstrap.service.ts`
- `src/common/utils/http-etag.ts`
- `src/modules/feedback/feedback.controller.ts`
- `src/modules/visits/visits.controller.ts`
- `src/modules/contacts/contacts.controller.ts`

## Pruebas

- Unit:
  - `src/modules/admin-bootstrap/admin-bootstrap.service.spec.ts`
  - `src/common/utils/http-etag.spec.ts`
- E2E:
  - `test/admin-bootstrap.e2e-spec.ts`
  - `test/http-etag-read-endpoints.e2e-spec.ts`
