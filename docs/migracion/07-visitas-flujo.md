# 07 - Módulo Visitas Flujo (chatbot flows)

## Alcance
- Estadísticas de visitas a flujos del chatbot para dashboard.
- Mantiene endpoint legacy `/visitas-flujo`; nombre amigable en doc: "chatbot flows".
- Protegido con `ADMIN_API_KEY`.

## Endpoint (v1)
- `GET /api/v1/visitas-flujo?from&to`
  - Si se envían `from` y `to` (ISO `YYYY-MM-DD`), cuenta conversaciones en ese rango por `ultimo_flujo`.
  - Si no se envían, devuelve los contadores existentes en `visitas_flujo`.
  - Respuesta: `{ visitasFlujo: [{ id, nombre_flujo, contador }], totalVisitas }`

## Autenticación
- Header `x-api-key: <ADMIN_API_KEY>` o query `?api_key=`.

## Estructura
- `src/modules/visits/`
  - `visits.module.ts`
  - `visits.controller.ts`
  - `visits.service.ts`
  - `dto/visits.dto.ts`
  - `visits.service.spec.ts`

## Notas
- Reutiliza entidades `Flow` (visitas_flujo) y `Converstation`.
- No modifica esquema; `synchronize` permanece desactivado.
- Versionado URI `v1`.
- `GET /api/v1/visitas-flujo` ahora incluye `ETag` y puede responder `304` con `If-None-Match`.

## Pruebas
- Unit tests con repositorios mock (`visits.service.spec.ts`).
- Ejecutar: `npm test -- --runInBand`.

