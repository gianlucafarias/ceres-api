# 17 - Feedback

## Objetivo
Migrar feedback del bot (calificaciones y comentarios).

## Acceso
- **ADMIN_API_KEY** (dashboard).

## Endpoints
- `GET /api/v1/feedback`

## Notas
- El dashboard actualmente consume este endpoint desde el cliente. Debe migrarse a un API route/server action que agregue `x-api-key`.

## Postman
- Nueva carpeta **Feedback** con ejemplo.

