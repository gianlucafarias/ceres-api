# 24 - Dashboard contratos y performance

## Objetivo

Alinear contratos REST usados por el dashboard y reducir overfetch en endpoints de alto trafico.

## Cambios de contrato (v1)

### GET /api/v1/contacts/:id/conversations

- Query soportada: `from`, `to`, `page`, `limit`
- Respuesta:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### GET /api/v1/history?phone=&page=&limit=

- Respuesta unificada:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### GET /api/v1/contacts

- `order` ahora acepta `ASC|DESC` y `asc|desc`.

### GET /api/v1/contacts/:id

- Si el contacto no existe, responde `404 Not Found`.

### POST/PUT /api/v1/config/:clave

- Respuesta estandarizada: devuelve el objeto `config` directo (sin wrapper `{ message, config }`).

## Indices SQL

Se agrego migracion TypeORM aditiva (sin DROP):

- `src/database/migrations/202602090001-dashboard-indexes.migration.ts`

Comandos:

```bash
npm run migration:show
npm run migration:run
```

Para entorno productivo (sobre `dist`, sin `ts-node`):

```bash
npm run build
npm run migration:show:dist
npm run migration:run:dist
```

Tambien se dejo script SQL idempotente como respaldo:

- `scripts/sql/2026-02-09-dashboard-indexes.sql`

Aplica los indices:

- `conversaciones(contact_id, fecha_hora)`
- `history(phone, created_at)`
- `history(contact_id, created_at)`
- `contact(last_interaction)`

La migracion usa `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, corre fuera de transaccion y no elimina objetos en `down`.
