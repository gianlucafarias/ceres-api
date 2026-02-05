# Ceres API (NestJS 11) — Migración incremental desde Express

Backend público de referencia para la ciudad de Ceres. Migramos paso a paso el servidor Express legacy a NestJS 11, manteniendo la base de datos PostgreSQL y compatibilidad de endpoints mientras modernizamos arquitectura, seguridad y DX.

## Estado actual
- Infra básica lista: ConfigModule global, TypeORM con `synchronize: false`, Redis opcional, healthcheck `GET /api/v1/health`.
- Modelo de datos portado a TypeORM (ver `src/entities/`).
- DTOs alineados con el backend legacy por módulo (ver `src/modules/*/dto`).
- Documentación de fases en `docs/migracion/`.

## Cómo correr
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
Ver `docs/migracion/21-ci-cd.md` para pasos de configuración completos.

## Estructura clave
- `src/entities`: entidades TypeORM mapeadas 1:1 a tablas existentes.
- `src/modules/*/dto`: DTOs y contratos de validación (`class-validator`) por módulo.
- `src/shared/redis`: servicio Redis global (opcional).
- `docs/migracion`: guías por fase (infra, entidades, DTOs, próximos módulos).

## Estrategia de ramas
- Rama protegida: `main`.
- Desarrollo activo: `develop`.
- Cada avance se trabaja en ramas feature cortas desde `develop` y se mergea con PR/FF; no se pushea a `main` sin revisión.

## Roadmap breve
1. Completar health y conexión DB/Redis en entornos reales.
2. Migrar módulos en orden: Analytics/Contactos → Reclamos → Encuesta+Redis → Notificaciones → Impuestos → BotConfig/Feedback/Votante → Amelia → Farmacias/Duty.
3. Añadir autenticación JWT+roles y API keys para bot/webhooks al iniciar la migración de módulos.
4. Pruebas de paridad E2E contra el legacy en cada módulo antes de mover tráfico.

## Licencia
UNLICENSED (se definirá al hacer público el repo).
