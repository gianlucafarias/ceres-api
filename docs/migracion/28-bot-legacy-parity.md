# 28 - Bot parity para salir de legacy (votante, certificados, reclamos)

## Objetivo

Cerrar endpoints pendientes para que el bot deje de depender de:

- `legacy /api/api/votante/:dni`
- `legacy /api/api/crear-certificado`
- `authpanel /api/tipoReclamo`
- consulta local a DB por telefono para ultimo reclamo

## Endpoints nuevos

### Votante

- `GET /api/v1/votante/:documento` (`BOT_API_KEY`)
  - Respuesta compatible bot:
    - `mesa`, `nombre`, `documento`, `orden`, `direccion`, `error`
  - Compatibilidad: cuando no existe, devuelve `200` con `error` (sin romper flujo actual del bot).
- `POST /api/v1/votante/importar` (`ADMIN_API_KEY`)
  - Body:
    - `registros: []`
    - `reemplazar?: boolean`
  - Respuesta:
    - `{ inserted: number, replaced: boolean }`

### Certificados

- `POST /api/v1/certificados/crear` (`BOT_API_KEY`)
  - Request:
    - `name`, `documentNumber`
  - Response:
    - `{ pdfUrl: string }`
  - Garantiza URL estable por documento:
    - `/modified_certificates/certificado-<documentNumber>.pdf`

### Reclamos (bot)

- `GET /api/v1/reclamos/tipos` (`BOT_API_KEY`)
  - Response:
    - `[{ id, nombre }]` a partir de tipos distintos de `reclamos.reclamo`.
- `GET /api/v1/reclamos/bot/ultimo?telefono=...` (`BOT_API_KEY`)
  - Response:
    - mismo shape de `GET /api/v1/reclamos/:id/estado` + `id`
    - sin exponer `telefono`

## Implementacion

- Nuevos modulos:
  - `src/modules/votante/`
  - `src/modules/certificados/`
- Extension de modulo existente:
  - `src/modules/reclamos/` con nuevos metodos bot + repositorio.
- Registro en `AppModule`:
  - `VotanteModule`
  - `CertificadosModule`

## Validacion

- Unit tests:
  - `src/modules/votante/votante.service.spec.ts`
  - `src/modules/certificados/certificados.service.spec.ts`
  - `src/modules/reclamos/reclamos.service.spec.ts` (nuevos casos bot)
- E2E tests:
  - `test/votante.e2e-spec.ts`
  - `test/certificados.e2e-spec.ts`
  - `test/reclamos-bot-extra.e2e-spec.ts`

## Notas

- Se mantiene pendiente la idempotencia de `POST /api/v1/reclamos` para despliegue multi-instancia (fase siguiente).
