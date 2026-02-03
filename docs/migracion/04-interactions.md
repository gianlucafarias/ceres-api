# 04 - Módulo Interactions

## Alcance
- Migración de endpoints de métricas de interacciones del backend Express.

## Endpoints (v1)
- `GET /v1/interactions/last-week/count/:start_date/:end_date/:group_by`  
  - `group_by`: `day | hour | keyword`
- `GET /v1/interactions/today`
- `GET /v1/interactions/count/:start_date/:end_date`
- `GET /v1/interactions/count?from&to`

## Estructura
- `src/modules/interactions/`
  - `dto/interactions.dto.ts`
  - `interactions.controller.ts`
  - `interactions.service.ts`
  - `interactions.service.spec.ts`

## Notas
- Reutiliza entidad `History` existente.
- No modifica esquema; `synchronize` permanece desactivado.
- Versionado URI (`v1`), sin prefijo adicional.

## Pruebas
- Unit tests con repositorio mock (`interactions.service.spec.ts`), ejecutar con `npm test -- --runInBand`.
