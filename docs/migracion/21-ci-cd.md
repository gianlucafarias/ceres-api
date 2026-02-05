# 21 - CI/CD con Docker + GHCR

## Objetivo
Deploy automatico desde `main` usando Docker y GitHub Container Registry (GHCR).

## Requisitos en GitHub (Secrets)
Configurar en el repositorio:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT`
- `GHCR_USERNAME` (tu usuario de GitHub)
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
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

## Flujo de deploy
1) Push/Merge a `main`.
2) GitHub Actions construye la imagen y la sube a GHCR.
3) Workflow se conecta al VPS, hace `docker login`, `docker compose pull` y `up -d`.

## Archivos
- `.github/workflows/ci.yml`: lint + test + build en PR y main.
- `.github/workflows/deploy.yml`: build + deploy a VPS.
- `docker-compose.yml`: levanta la API en `3022` con `.env` local.

## Operacion
- Ver health: `GET http://<vps>:3022/api/v1/health`
- Logs: `docker logs -f ceres-api`

## Seguridad
- `.env` queda solo en el VPS (no se sube al repo).
- Imagen privada en GHCR; el VPS usa `GHCR_TOKEN` para leer.
