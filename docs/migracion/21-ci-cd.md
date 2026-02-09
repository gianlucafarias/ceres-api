# 21 - CI/CD con Docker + GHCR

## Objetivo
Deploy automatico desde `main` con imagen versionada por commit (`git sha`), healthcheck y rollback automatico en VPS.

## Requisitos en GitHub (Secrets)
Configurar en el repositorio:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT`
- `GHCR_USERNAME` (usuario de GitHub con acceso a paquetes)
- `GHCR_TOKEN` (PAT con scope `read:packages`)

## Requisitos en el VPS
1) Crear directorio y clonar repo:
```bash
sudo mkdir -p /var/www/ceres-api
sudo chown $USER:$USER /var/www/ceres-api
cd /var/www/ceres-api
git clone https://github.com/gianlucafarias/ceres-api.git .
```

2) Crear archivo `.env` con variables reales:
```bash
cp .env.example .env
nano .env
```

3) Instalar Docker y Compose (si no estan):
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

Si tu distro soporta plugin V2, tambien sirve:
```bash
sudo apt-get install -y docker-compose-plugin
```

## Flujo de deploy
1. Push/Merge a `main`.
2. GitHub Actions construye imagen y publica en GHCR (`:main` y `:<git-sha>`).
3. Workflow conecta al VPS por SSH.
4. Se despliega con `API_IMAGE_TAG=<git-sha> docker compose up -d`.
5. Se espera estado `healthy` del contenedor.
6. Si falla, se hace rollback automatico a la imagen que estaba corriendo (snapshot local `rollback-local`); si no existe snapshot, usa el tag guardado en `.deploy/current_api_image_tag`.
7. Si `.env` tiene `OBS_STACK_ENABLED=true`, el deploy tambien levanta `prometheus` y `grafana`.

## Archivos
- `.github/workflows/ci.yml`: tests y build.
- `.github/workflows/deploy.yml`: build + push + deploy + rollback.
- `docker-compose.yml`: API en `3022`, healthcheck y soporte de `API_IMAGE_TAG`.
- `docker-compose.observability.yml`: stack opcional de observabilidad para VPS (Prometheus/Grafana).

## Operacion
- Ver health desde VPS: `curl -fsS http://127.0.0.1:3022/api/v1/health`
- Ver estado del contenedor: `docker inspect --format='{{.State.Health.Status}}' ceres-api`
- Logs: `docker logs -f ceres-api`

## Seguridad
- `.env` queda solo en el VPS (no se sube al repo).
- Imagen privada en GHCR; el VPS usa `GHCR_TOKEN` para leer.
- El deploy usa `git pull --ff-only` (evita sobrescribir trabajo local con `reset --hard`).
- El deploy soporta `docker compose` y `docker-compose`.

## Estado actual
- Desarrollo diario en `develop`.
- Produccion y deploy automatico desde `main`.
- Si todavia no activaron secretos/workflows, usar deploy manual con `scripts/deploy-vps.sh` (ver `docs/migracion/22-deploy-gradual-vps.md`).
- Flujo de ramas recomendado: ver `docs/migracion/23-estrategia-ramas.md`.
