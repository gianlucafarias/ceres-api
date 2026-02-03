# 02 - DTOs y contratos iniciales

Objetivo: tipar requests/responses del legacy antes de mover módulos. Los DTOs viven en `src/contracts/`.

## Comunes
- `DateRangeQueryDto` (`from`,`to` ISO opcionales)
- `PaginationQueryDto` (`limit`,`offset`)

## Analytics / Contactos / History
- `InteractionsRangeParamsDto`, `InteractionsGroupParamsDto`, `InteractionsCountQueryDto`
- `ContactsQueryDto`, `ContactIdParamDto`, `ConversationsRangeQueryDto`

## Reclamos
- `CrearReclamoDto`, `ActualizarReclamoDto`, `ActualizarPrioridadDto`, `ReclamoIdParamDto`, `ReclamoPdfParamsDto`

## Encuesta + Redis
- `ValidarDniDto`, `GuardarEncuestaDto` (arrays con límites iguales al legado, teléfono validado como AR)

## Notificaciones
- `ActualizarPreferenciasDto`, `ObtenerPreferenciasParamsDto`, `ActualizarSeccionDto`, `EjecutarNotificacionesManualDto`

## Impuestos
- `ConsultaGenericaDto`, `ConsultarDeudaDto`, `SolicitarCedulonDto`, `GetPdfParamsDto`

## Bot Config / Feedback / Votante
- `UpsertBotConfigDto`, `BotConfigParamsDto`
- `ImportarVotantesDto`, `BuscarVotanteParamsDto`
- `FeedbackQueryDto` (placeholder para futuros filtros)

## Amelia Turnos
- `AmeliaWebhookDto`, `TurnoIdParamDto`, `AmeliaBookingIdParamDto`, `TelefonoParamDto`, `UpdateEstadoTurnoDto`, `ReintentarNotificacionesDto`

## Farmacias / Duty Schedule
- `UpdatePharmacyDto`, `PharmacyCodeParamDto`, `DutyDateParamDto`, `DutyRangeQueryDto`

### Convenciones
- Prefijo `ParamsDto` para path params, `QueryDto` para querystring, `Dto` simple para body.
- Validación global habilitada (`ValidationPipe` whitelist + transform).
- Fechas en ISO 8601; números de teléfono se normalizarán en servicios posteriores.

### Próximos pasos
- Al migrar cada módulo, reutilizar estos DTOs en controladores Nest.
- Completar DTOs de respuesta tipada por dominio (cuando movamos servicios).
