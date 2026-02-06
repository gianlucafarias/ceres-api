# 23 - Estrategia profesional de ramas

## Objetivo
Asegurar que `main` siempre sea estable y desplegable, usando `develop` como rama de integracion.

## Modelo de ramas
- `main`: produccion. Solo entra codigo probado y listo para deploy.
- `develop`: integracion de features. Base para QA funcional.
- `feature/<nombre>`: desarrollo de una funcionalidad puntual.
- `hotfix/<nombre>`: correcciones urgentes que salen desde `main`.

## Flujo normal
1. Crear feature desde `develop`.
2. Abrir PR `feature/* -> develop`.
3. Al aprobar/mergear, validar en entorno de integracion.
4. Cuando haya un corte estable, abrir PR `develop -> main`.
5. Merge a `main` dispara deploy productivo.

## Flujo de hotfix
1. Crear `hotfix/*` desde `main`.
2. PR `hotfix/* -> main`.
3. Deploy automatico de hotfix.
4. PR adicional `main -> develop` para no perder el fix en integracion.

## Reglas de proteccion recomendadas
- Proteger `main` y `develop`.
- Requerir PR (sin push directo).
- Requerir checks verdes (`CI / lint`, `CI / test`, `CI / build`).
- Requerir al menos 1 aprobacion de review.
- Habilitar "Require branches to be up to date".

## Convencion de merges
- `feature/* -> develop`: squash merge (historial limpio).
- `develop -> main`: merge commit (preserva contexto del release).
- `hotfix/* -> main`: squash o merge commit segun urgencia.

## Estado actual del repo
- Rama actual de trabajo: `feature/ci-cd-docker`.
- Aun no hubo deploy desde `main`.
- Hay que promover cambios en este orden: `feature/ci-cd-docker -> develop -> main`.

## Runbook inmediato (tu caso)
```bash
# 1) publicar rama feature actual
git checkout feature/ci-cd-docker
git push -u origin feature/ci-cd-docker

# 2) abrir PR: feature/ci-cd-docker -> develop
# 3) mergear PR cuando CI este verde

# 4) abrir PR: develop -> main
# 5) mergear PR para disparar deploy a produccion
```
