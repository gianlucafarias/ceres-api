# 09 - Módulo Reclamos PDF

## Alcance
- Generación de PDF de reclamo para bot y dashboard.
- Endpoint único protegido por API key (admin o bot).

## Endpoint (v1)
- `GET /api/v1/reclamos/:id/pdf`

## Seguridad
- Header `x-api-key: <ADMIN_API_KEY>` o `x-api-key: <BOT_API_KEY>`  
  (también acepta `?api_key=`).

## Estructura
- `src/modules/reclamos-pdf/`
  - `reclamos-pdf.module.ts`
  - `reclamos-pdf.controller.ts`
  - `reclamos-pdf.service.ts`
  - `reclamos-pdf.service.spec.ts`

## Notas
- Usa `pdf-lib` y `date-fns` (locale `es`).
- Si no existe reclamo → 404.
- Mantiene formato del PDF legacy (limpieza de caracteres y word wrap).

## Pruebas
- Unit test de servicio (reclamo inexistente).
- Ejecutar: `npm test -- --runInBand`.

