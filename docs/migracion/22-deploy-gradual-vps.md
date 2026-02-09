# 22 - Deploy gradual en VPS (legacy + NestJS)

## Objetivo
Mantener el backend legacy activo mientras migramos endpoints al backend NestJS, con rollback rapido y sin cambiar todo de una vez.

## Decision operativa
- Legacy: queda en PM2 como esta hoy.
- Nuevo backend (`ceres-api`): se despliega en Docker Compose.
- Apache2: controla el corte de trafico por endpoint o por modulo (patron strangler).

## Topologia recomendada
- Legacy PM2 en `127.0.0.1:<LEGACY_PORT>`.
- Nuevo NestJS Docker en `127.0.0.1:3022`.
- Apache2 al frente con TLS y reglas de ruteo incremental.

## Apache2 para convivencia
Regla base: todo sigue yendo al legacy, salvo endpoints explicitamente migrados.

```apache
<VirtualHost *:443>
    ServerName api.tudominio.gob.ar

    SSLEngine on
    # Certificados SSL segun tu setup (Let's Encrypt u otro)
    # SSLCertificateFile /etc/letsencrypt/live/api.tudominio.gob.ar/fullchain.pem
    # SSLCertificateKeyFile /etc/letsencrypt/live/api.tudominio.gob.ar/privkey.pem

    ProxyPreserveHost On
    ProxyAddHeaders On
    RequestHeader set X-Forwarded-Proto "https"

    # Endpoints migrados al nuevo backend (legacy /v1/* -> nest /api/v1/*)
    ProxyPass        /v1/health        http://127.0.0.1:3022/api/v1/health
    ProxyPassReverse /v1/health        http://127.0.0.1:3022/api/v1/health
    ProxyPass        /v1/contacts      http://127.0.0.1:3022/api/v1/contacts
    ProxyPassReverse /v1/contacts      http://127.0.0.1:3022/api/v1/contacts
    ProxyPass        /v1/interactions  http://127.0.0.1:3022/api/v1/interactions
    ProxyPassReverse /v1/interactions  http://127.0.0.1:3022/api/v1/interactions
    ProxyPass        /v1/history       http://127.0.0.1:3022/api/v1/history
    ProxyPassReverse /v1/history       http://127.0.0.1:3022/api/v1/history

    # Todo lo demas queda en legacy
    ProxyPass        /v1/ http://127.0.0.1:<LEGACY_PORT>/v1/
    ProxyPassReverse /v1/ http://127.0.0.1:<LEGACY_PORT>/v1/

    # Namespace nativo de NestJS
    ProxyPass        /api/ http://127.0.0.1:3022/api/
    ProxyPassReverse /api/ http://127.0.0.1:3022/api/
</VirtualHost>
```

Modulos requeridos:

```bash
sudo a2enmod proxy proxy_http headers ssl
sudo systemctl reload apache2
```

## Migracion de variables de entorno
1. Tomar inventario de variables actuales del legacy (`pm2 show <app>` y archivo ecosystem).
2. Mapear contra `.env.example` de este repo.
3. Crear `/var/www/ceres-api/.env` en VPS (no versionado).
4. Definir responsables de rotacion para secretos (`ADMIN_API_KEY`, `BOT_API_KEY`, credenciales DB/Redis).
5. Antes de migrar un modulo, verificar que sus variables esten cargadas en el `.env` de NestJS.

## Deploy automatico (main)
- CI construye imagen en GHCR con tags `main` y `<git-sha>`.
- El deploy en VPS levanta la version por `<git-sha>`.
- Se valida estado del contenedor (`healthy`).
- Si falla, hace rollback automatico a la imagen que estaba corriendo (`rollback-local`) o al tag previo registrado.

## Deploy manual (estado actual)
Mientras no este activado CI/CD, ejecutar en VPS:

```bash
cd /var/www/ceres-api
chmod +x scripts/deploy-vps.sh
BRANCH=main IMAGE_TAG=main ./scripts/deploy-vps.sh
```

Notas:
- Si `OBS_STACK_ENABLED=true` en `.env`, el script levanta tambien `prometheus` y `grafana` con `docker-compose.observability.yml`.
- Las imagenes de observabilidad se resuelven desde GHCR (`ceres-prometheus` y `ceres-grafana`).
- Puertos por defecto observabilidad (solo localhost VPS): Prometheus `127.0.0.1:9091`, Grafana `127.0.0.1:3003`.
- Para acceso remoto seguro usar tunel SSH:
  `ssh -L 3003:127.0.0.1:3003 -L 9091:127.0.0.1:9091 <user>@<vps>`.
- Para entorno de integracion: `BRANCH=develop IMAGE_TAG=develop ./scripts/deploy-vps.sh`.
- Si quieren desplegar una imagen puntual: `IMAGE_TAG=<sha-publicado> ./scripts/deploy-vps.sh`.
- El script hace healthcheck del contenedor y rollback automatico si falla.

## Runbook de rollback manual
Si necesitas volver una version manualmente:

```bash
cd /var/www/ceres-api
API_IMAGE_TAG=<tag_estable> docker compose up -d --remove-orphans api
```

Verificar:

```bash
docker inspect --format='{{.State.Health.Status}}' ceres-api
curl -fsS http://127.0.0.1:3022/api/v1/health
```

## Checklist por cada modulo migrado
1. Habilitar regla `ProxyPass` en Apache2 hacia NestJS para ese modulo.
2. Ejecutar prueba de paridad funcional contra legacy.
3. Monitorear errores y latencia por 24-48 horas.
4. Si todo queda estable, mantener ruta en NestJS y avanzar al siguiente modulo.
