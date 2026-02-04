# 18 - Conversaciones

## Objetivo
Migrar listado de conversaciones (resumen) con filtro de fechas.

## Acceso
- **ADMIN_API_KEY** (dashboard).

## Endpoints
- `GET /v1/conversaciones?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Si `from` y `to` no se envian, devuelve todo.

## Notas
- El dashboard actualmente consume este endpoint desde el cliente. Debe migrarse a un API route/server action que agregue `x-api-key`.

## Postman
- Nueva carpeta **Conversaciones** con ejemplo.
