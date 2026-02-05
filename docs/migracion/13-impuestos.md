# 13 - Impuestos

## Objetivo
Migrar los endpoints de impuestos municipales manteniendo compatibilidad con el legacy.

## Acceso
- **BOT_API_KEY** (solo bot).
  - El bot debe enviar header `x-api-key` con el valor de `BOT_API_KEY`.

## Endpoints
- `POST /api/v1/impuestos/consulta`
  - Body libre (se envia tal cual a la API municipal).
  - Respuesta: `{ RESU, RESPUESTA, MENS? }`.
- `GET /api/v1/impuestos/pdf/:tipo/:partida`
  - Genera URL de PDF, valida existencia con HEAD.
  - Respuesta OK: `{ success: true, url }`.
  - Error: `400` con `{ error }`.
- `POST /api/v1/impuestos/consultar-deuda`
  - Body: `{ REGLOG, ESTADO }`.
  - Error: `400` si RESU != OK.
- `POST /api/v1/impuestos/solicitar-cedulon`
  - Body: `{ REGNRO }`.
  - Respuesta OK agrega `urlPDF`.
  - Error: `400` si RESU != OK.

## Configuracion
Agregar en `.env` o `.env.local`:
- `IMPUESTOS_API_URL` (default: `https://mceres-server.dyndns.org/unire_api.php`)
- `IMPUESTOS_MUNI_URL` (default: `https://mceres-server.dyndns.org/`)
- `IMPUESTOS_OPE_NOM` (default: `PS`)
- `IMPUESTOS_OPE_PAS` (default: `123456`)

## Notas
- Se mantiene `POST /consulta` con body libre para no romper payloads actuales.
- Timeout externo: 30s.
- PDF: hasta 5 intentos con 1s de espera entre HEADs.

## Postman
- Nueva carpeta **Impuestos** con ejemplos de cada endpoint.

