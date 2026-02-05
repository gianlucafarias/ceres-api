# 10 - Estadisticas de Reclamos

## Alcance
- Estadisticas avanzadas para dashboard.
- Endpoints compatibles con legacy: count-by-status/priority/type/barrio.
- Se mantiene el formato raw (counts como string).

## Seguridad
- Dashboard: `ADMIN_API_KEY` (header `x-api-key` o `?api_key=`).

## Endpoints (v1)
- `GET /api/v1/reclamos/estadisticas`
- `GET /api/v1/reclamos/count-by-status`
- `GET /api/v1/reclamos/count-by-priority`
- `GET /api/v1/reclamos/count-by-type`
- `GET /api/v1/reclamos/count-by-barrio`

## Respuestas
### `GET /api/v1/reclamos/estadisticas`
```json
{
  "reclamosPorMes": [{ "mes": "2026-01-01T00:00:00.000Z", "cantidad": "12" }],
  "tiempoPromedioResolucion": "3.5",
  "eficienciaCuadrilla": [{ "cuadrillaId": 2, "reclamosResueltos": "5" }]
}
```

### `GET /api/v1/reclamos/count-by-status`
```json
[{ "estado": "PENDIENTE", "count": "10" }]
```

### `GET /api/v1/reclamos/count-by-priority`
```json
[{ "prioridad": "ALTA", "count": "7" }]
```

### `GET /api/v1/reclamos/count-by-type`
```json
[{ "tipo": "bache", "count": "3" }]
```

### `GET /api/v1/reclamos/count-by-barrio`
```json
[{ "barrio": "centro", "count": "6" }]
```

## Estructura
- `src/modules/reclamos/reclamos.admin.controller.ts`
- `src/modules/reclamos/reclamos.service.ts`
- `src/modules/reclamos/reclamos.service.spec.ts`

## Notas
- `count-by-barrio` normaliza el texto (`LOWER`, quita prefijo `barrio `).
- `estadisticas` calcula ultimos 6 meses, tiempo promedio de resolucion y eficiencia por cuadrilla.

