# 03 - Módulo Users (métricas básicas)

## Alcance
- Reemplaza `/api/users/count` del backend Express.
- Filtra por rango de fechas opcional (`from`, `to`) sobre `contact.created_at`.

## Endpoint (v1)
- `GET /api/v1/users/count?from&to`
  - Params opcionales `from`, `to` en ISO 8601.
  - Respuesta: `{ "count": number }`.

## Estructura
- `src/modules/users`
  - `users.module.ts`
  - `users.controller.ts`
  - `users.service.ts`
  - `dto/users-count.dto.ts`
  - `users.service.spec.ts`

## Notas
- Usa TypeORM sobre la entidad `Contact` ya existente.
- No cambia esquema; `synchronize` sigue en `false`.
- Versionado URI (`v1`); sin prefijo adicional.

## Pruebas
- Unit test con repositorio mock (`users.service.spec.ts`), se ejecuta con `npm test -- --runInBand`.

