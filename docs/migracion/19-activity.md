# 19 - Activity (log de actividad)

## Alcance
- Migrar el endpoint legacy `/api/recent` a Nest.
- Exponer un endpoint claro para el dashboard: `/api/v1/activity/recent`.
- Fuente: tabla `activity_log`.

## Endpoints
- `GET /api/v1/activity/recent`
  - **Query**:
    - `limit` (opcional, 1..100, default 10)
    - `type` (opcional, filtra por tipo de actividad)
  - **Auth**: `x-api-key` (admin/dashboard)
  - **Response** (array):
    ```json
    [
      {
        "id": 1,
        "type": "RECLAMO",
        "action": "CREACION",
        "description": "Nuevo reclamo registrado",
        "entityId": 123,
        "userId": 45,
        "createdAt": "2026-02-05T12:00:00.000Z",
        "metadata": { "barrio": "Centro" },
        "timeAgo": "Hace 2 horas"
      }
    ]
    ```

## Postman
ColecciÃ³n: `Activity > GET /v1/activity/recent`.

## Notas
- `timeAgo` se calcula en el backend para mantener compatibilidad con el dashboard actual.
- Si se decide otro nivel de acceso, ajustar el guard en el controlador.
