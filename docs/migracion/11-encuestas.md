# 11 - Modulo Encuestas (Presupuesto/Obras)

## Alcance
- Formulario publico: validar DNI y guardar encuesta.
- Dashboard: listado, detalle, edicion, eliminacion y estadisticas.
- Redis: solo cache de validacion DNI (no se usa cola temporal).

## Seguridad
- Publico (sin API key):
  - `POST /v1/validar-dni`
  - `POST /v1/guardar`
  - `GET /v1/encuestaobras/estado/:id`
- Dashboard: `ADMIN_API_KEY`.

## Endpoints (v1)
### Publico
- `POST /v1/validar-dni`
- `POST /v1/guardar`
- `GET /v1/encuestaobras/estado/:id`

### Dashboard (ADMIN_API_KEY)
- `GET /v1/encuestaobras/estadisticas` (opcional `?barrio=`)
- `GET /v1/encuestaobras/estadisticas-redis`
- `GET /v1/encuestaobras/todas` (query: `page`, `per_page`, `sort`, `order`, `barrio`, `estado`, `desde`, `hasta`, `search`)
- `GET /v1/encuestaobras/por-barrio/:barrio`
- `GET /v1/encuestaobras/respuesta/:id`
- `PUT /v1/encuestaobras/editar/:id`
- `DELETE /v1/encuestaobras/eliminar/:id`
- `GET /v1/encuestaobras/:id` (alias de respuesta)

## Respuestas
- Se mantiene el formato `{ success: true, data: ... }` para el dashboard.
- `estado/:id` devuelve estado de procesamiento (sin PII).

## Redis
- No se usa cola temporal ni background processor (para evitar jobs en esta etapa).
- Cache de validacion de DNI (TTL 1h) si Redis esta configurado.
- `estadisticas-redis` retorna contadores en 0 si Redis no esta habilitado.

## Estructura
- `src/modules/encuestas/`
  - `encuestas.module.ts`
  - `encuestas.service.ts`
  - `encuestas.public.controller.ts`
  - `encuestas.admin.controller.ts`
  - `dto/encuestas-public.dto.ts`
  - `dto/encuestas-admin.dto.ts`
  - `encuestas.service.spec.ts`

## Pruebas
- `npm test -- encuestas`

## Notas
- Se reutiliza la entidad `EncuestaPresupuesto`.
- Se valida DNI (7-8 digitos) y limites de arrays (`obrasUrgentes` max 3, `serviciosMejorar` max 2).
- `obrasUrgentes`, `serviciosMejorar` se guardan en `jsonb`.
