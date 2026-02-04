# 16 - Bot Config

## Objetivo
Migrar configuraciones dinamicas del bot (claves/valores y expiracion).

## Acceso
- **ADMIN_API_KEY** (dashboard).

## Endpoints
- `GET /v1/config`
- `GET /v1/config/:clave`
- `POST /v1/config/:clave`
  - Body: `{ valor: string, activo: boolean, fecha_expiracion?: string | null }`
- `PUT /v1/config/:clave`
  - Body: `{ valor: string, activo: boolean, fecha_expiracion?: string | null }`

## Notas
- `fecha_expiracion` acepta ISO o `null`.
- `fecha_actualizacion` se setea en cada create/update.
- El dashboard debe consumir estos endpoints desde un API route/server action que incluya `x-api-key` (no desde cliente directo).

## Postman
- Nueva carpeta **BotConfig** con ejemplos de endpoints.
