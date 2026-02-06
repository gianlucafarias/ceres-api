# Ceres API (NestJS 11) â€” MigraciÃ³n incremental desde Express

Backend pÃºblico de referencia para la ciudad de Ceres. Migramos paso a paso el servidor Express legacy a NestJS 11, manteniendo la base de datos PostgreSQL y compatibilidad de endpoints mientras modernizamos arquitectura, seguridad y DX.

## Estado actual
- Infra bÃ¡sica lista: ConfigModule global, TypeORM con `synchronize: false`, Redis opcional, healthcheck `GET /api/v1/health`.
- Modelo de datos portado a TypeORM (ver `src/entities/`).
- DTOs alineados con el backend legacy por mÃ³dulo (ver `src/modules/*/dto`).
- DocumentaciÃ³n de fases en `docs/migracion/`.

## CÃ³mo correr
```bash
npm install
cp .env.example .env    # completar credenciales reales
npm run start:dev
# healthcheck
curl http://localhost:${PORT:-3000}/api/v1/health
```

## Docker (local)
```bash
docker build -t ceres-api:local .
docker run --rm -p 3022:3022 \
  -e PORT=3022 \
  -e NODE_ENV=production \
  -e DB_HOST=... -e DB_PORT=5432 -e DB_USERNAME=... -e DB_PASSWORD=... -e DB_DATABASE=... \
  -e REDIS_HOST=... -e REDIS_PORT=6379 -e REDIS_PASSWORD=... \
  -e ADMIN_API_KEY=... -e BOT_API_KEY=... \
  ceres-api:local
```

## CI/CD (Docker + GHCR)
Ver `docs/migracion/21-ci-cd.md` para pasos de configuraciÃ³n completos.
Para rollout incremental con legacy + Apache2, ver `docs/migracion/22-deploy-gradual-vps.md`.
Para estrategia profesional de ramas, ver `docs/migracion/23-estrategia-ramas.md`.
Mientras no se haga merge a `main`, usar deploy manual con `scripts/deploy-vps.sh`.

## Estructura clave
- `src/entities`: entidades TypeORM mapeadas 1:1 a tablas existentes.
- `src/modules/*/dto`: DTOs y contratos de validaciÃ³n (`class-validator`) por mÃ³dulo.
- `src/shared/redis`: servicio Redis global (opcional).
- `docs/migracion`: guÃ­as por fase (infra, entidades, DTOs, prÃ³ximos mÃ³dulos).

## Estrategia de ramas
- Desarrollo activo: `develop`.
- Rama de release/produccion: `main`.
- Cada avance se trabaja en ramas feature cortas desde `develop` y se mergea con PR/FF.

## Roadmap breve
1. Completar health y conexiÃ³n DB/Redis en entornos reales.
2. Migrar mÃ³dulos en orden: Analytics/Contactos â†’ Reclamos â†’ Encuesta+Redis â†’ Notificaciones â†’ Impuestos â†’ BotConfig/Feedback/Votante â†’ Amelia â†’ Farmacias/Duty.
3. AÃ±adir autenticaciÃ³n JWT+roles y API keys para bot/webhooks al iniciar la migraciÃ³n de mÃ³dulos.
4. Pruebas de paridad E2E contra el legacy en cada mÃ³dulo antes de mover trÃ¡fico.

## Licencia
UNLICENSED (se definirÃ¡ al hacer pÃºblico el repo).
