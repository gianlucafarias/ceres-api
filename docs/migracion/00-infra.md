# 00 - Infra y conexión (NestJS 11)

## Objetivo
Dejar la base del proyecto Nest lista para convivir con el backend Express: configuración por entorno, conexión segura a Postgres con TypeORM 0.3 y chequeos de salud para DB y Redis.

## Configuración de entorno
Archivo `.env` (ver `.env.example`):

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (opcional)
- `PORT`, `NODE_ENV`

`ConfigModule` se carga global y lee `.env`, `.env.local`, `.env.development`.

## TypeORM
- `synchronize: false`
- Logging habilitado si `NODE_ENV !== 'production'`.
- Entidades importadas desde `src/entities`.
- Conexión única inicializada en `AppModule` mediante `TypeOrmModule.forRootAsync`.

## Redis
- Servicio global `RedisService` con `redis` v4.
- Ping bajo demanda; no bloquea el arranque si falta.

## Healthcheck
- Endpoint `GET /v1/health` (versioning URI).
- Respuesta:
  ```json
  {
    "status": "ok",
    "checks": {
      "database": { "status": "up", "latencyMs": 2 },
      "redis": { "status": "up", "latencyMs": 1 }
    }
  }
  ```
- `status:error` si la DB está caída.

## Puertos y prefix
- `PORT` por defecto 3000.
- Prefijo global `v1` para nuevas rutas.

## Próximos pasos
- Validar conexión: `npm run start:dev` y abrir `GET http://localhost:3000/v1/health`.
- Ajustar nginx para rutear `/v1/*` al nuevo servicio (legacy sigue sirviendo `/api/*`).
