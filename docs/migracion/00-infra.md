# 00 - Infra y conexion (NestJS 11)

## Objetivo
Dejar la base del proyecto Nest lista para convivir con el backend Express: configuracion por entorno, conexion segura a Postgres con TypeORM 0.3 y chequeos de salud para DB y Redis.

## Configuracion de entorno
Archivo `.env` (ver `.env.example`):

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (opcional)
- `PORT`, `NODE_ENV`
- `TRUST_PROXY`, `RATE_LIMIT_*`, `MEDIA_PODA_PATH`, `MODIFIED_CERTIFICATES_PATH`

`ConfigModule` se carga global y lee `.env`, `.env.local`, `.env.development`.

## TypeORM
- `synchronize: false`
- Logging habilitado si `NODE_ENV !== 'production'`.
- Entidades importadas desde `src/entities`.
- Conexion unica inicializada en `AppModule` mediante `TypeOrmModule.forRootAsync`.

## Redis
- Servicio global `RedisService` con `redis` v4.
- Ping bajo demanda; no bloquea el arranque si falta.

## Healthcheck
- Endpoint `GET /api/v1/health` (versionado URI + prefijo global `api`).
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
- `status:error` si la DB esta caida.

## Puertos y prefijo
- `PORT` por defecto 3000.
- Prefijo global `api` + versionado URI (`/api/v1`).

## Rate limiting
- Limite general por IP sobre `/api`.
- Limite estricto por IP sobre `/api/v1/encuestas`.
- Variables:
  - `TRUST_PROXY=1` si hay proxy reverso (Apache2) para leer `X-Forwarded-For`.
  - `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.
  - `RATE_LIMIT_STRICT_WINDOW_MS`, `RATE_LIMIT_STRICT_MAX`.

## Seguridad de payloads
- Content-Type requerido para `POST/PUT/PATCH` cuando hay body: `application/json`.
- JSON malformado devuelve `400 Bad Request` con mensaje estandar.

## Static files
- `/media/poda` sirve archivos desde `MEDIA_PODA_PATH` (default `./media/poda`).
- `/modified_certificates` sirve archivos desde `MODIFIED_CERTIFICATES_PATH` (default `./modified_certificates`).

## Proximos pasos
- Validar conexion: `npm run start:dev` y abrir `GET http://localhost:3000/api/v1/health`.
- Ajustar Apache2 para rutear `/api/v1/*` al nuevo servicio (el bot legacy sigue sirviendo `/v1/*`).
