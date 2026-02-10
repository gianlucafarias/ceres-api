# 15 - Farmacias y Farmacia de Turno

## Objetivo

Migrar endpoints de farmacias y turnos de farmacia (duty schedule).

## Acceso

- **Publico**: todos los GET.
- **ADMIN_API_KEY**: endpoints de update (PUT).

## Endpoints

### Farmacias

- `GET /api/v1/pharmacy/:code` (publico)
- `PUT /api/v1/pharmacy/:code` (admin)
  - Body: campos parciales `name`, `address`, `phone`, `lat`, `lng`, `googleMapsAddress`.

### Farmacia de turno

- `GET /api/v1/farmaciadeturno/today` (publico)
- `GET /api/v1/farmaciadeturno/calendar` (publico)
- `GET /api/v1/farmaciadeturno?from=YYYY-MM-DD&to=YYYY-MM-DD` (publico)
- `GET /api/v1/farmaciadeturno/bootstrap?from=YYYY-MM-DD&to=YYYY-MM-DD` (publico, ETag + If-None-Match)
- `GET /api/v1/farmaciadeturno/:date` (publico)
- `PUT /api/v1/farmaciadeturno/:date` (admin)
  - Body: `{ pharmacyCode }`

### Por farmacia

- `GET /api/v1/farmacia/:code/duty-schedule?from=YYYY-MM-DD&limit=20` (publico)

## Notas

- `limit` se limita entre 1 y 366.
- `from` por defecto es hoy.
- `pharmacyCode` se normaliza a mayusculas.

## Postman

- Nueva carpeta **Farmacias** con ejemplos de endpoints publicos y admin.
