# 05 - Módulo Contacts

## Alcance
- Endpoints de contactos y últimas interacciones del dashboard.
- Protegido con `ADMIN_API_KEY`.

## Endpoints (v1)
- `GET /api/v1/contacts/last-interactions`
- `GET /api/v1/contacts` (query: `sort=createdAt|updatedIn|lastInteraction`, `order=ASC|DESC`)
- `GET /api/v1/contacts/:id`
- `GET /api/v1/contacts/:id/conversations?from&to`

## Autenticación
- Header `x-api-key: <ADMIN_API_KEY>` o query `?api_key=<ADMIN_API_KEY>`.

## Estructura
- `src/modules/contacts/`
  - `contacts.module.ts`
  - `contacts.controller.ts`
  - `contacts.service.ts`
  - `dto/contacts.dto.ts`
  - `contacts.service.spec.ts`

## Notas
- Reutiliza entidades existentes: `Contact`, `History`, `Reclamo`, `Converstation`.
- No altera el esquema; `synchronize` sigue desactivado.
- Versionado URI `v1`.
- `GET /api/v1/contacts/last-interactions` ahora incluye `ETag` y puede responder `304` con `If-None-Match`.

## Pruebas
- Unit test de servicio con repositorios mock (`contacts.service.spec.ts`).
- Ejecutar: `npm test -- --runInBand`.

