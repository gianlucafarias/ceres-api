# 06 - Módulo History

## Alcance
- Historial de interacciones y conversaciones para dashboard.
- Protegido con `ADMIN_API_KEY`.

## Endpoints (v1)
- `GET /v1/history/last-day-interactions`
- `GET /v1/history/messages-per-day`
- `GET /v1/history/conversation-details?contactId|conversationId&page&limit`
- `GET /v1/history?phone=&page=&limit=`
- `GET /v1/history/conversation/:conversationId`
- `GET /v1/history/range?startDate=&endDate=`
- `GET /v1/history/all`

## Autenticación
- Header `x-api-key: <ADMIN_API_KEY>` o `?api_key=`.

## Estructura
- `src/modules/history/`
  - `dto/history.dto.ts`
  - `history.controller.ts`
  - `history.module.ts`
  - `history.service.ts`
  - `history.service.spec.ts`

## Notas
- Reutiliza `History` y `Contact` existentes.
- No altera esquema; `synchronize` sigue desactivado.
- Versionado URI `v1`.

## Pruebas
- Unit tests con repositorios mock (`history.service.spec.ts`).
- Ejecutar: `npm test -- --runInBand`.
