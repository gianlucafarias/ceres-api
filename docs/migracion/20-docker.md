# 20 - Docker build y run

## Objetivo
Empaquetar la API en una imagen Docker con build multi-stage y runtime liviano.

## Dockerfile
- Base: node:20-alpine.
- Stage build: instala deps, compila `dist/` y elimina dev deps.
- Stage runtime: copia `dist/` + `node_modules` y ejecuta `node dist/main`.

## Build
```bash
docker build -t ceres-api:local .
```

## Run (local)
```bash
docker run --rm -p 3022:3022 \
  -e PORT=3022 \
  -e NODE_ENV=production \
  -e DB_HOST=... -e DB_PORT=5432 -e DB_USERNAME=... -e DB_PASSWORD=... -e DB_DATABASE=... \
  -e REDIS_HOST=... -e REDIS_PORT=6379 -e REDIS_PASSWORD=... \
  -e ADMIN_API_KEY=... -e BOT_API_KEY=... \
  ceres-api:local
```

## Healthcheck
- `GET http://localhost:3022/api/v1/health`

## Notas
- Si hay nginx/proxy, setear `TRUST_PROXY=1`.
- Paths estaticos: `MEDIA_PODA_PATH` y `MODIFIED_CERTIFICATES_PATH`.
