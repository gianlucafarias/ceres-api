# 30 - Recordatorios automaticos: verificacion de cuenta y certificado penal

## Objetivo

Agregar en `ceres-api` un proceso automatico de recordatorios para usuarios/profesionales pendientes, reutilizando la arquitectura actual de observabilidad y cola central de emails:

- `ops_event_log` para trazabilidad.
- `OpsEmailQueueService` para encolado y delivery.
- templates centralizados en `ops-email.templates.ts`.
- idempotencia por `idempotencyKey`.
- provider strategy existente (`resend-first` con fallback SMTP).

No se busca cambiar reglas de seguridad:

- no auto-verificar cuentas.
- no habilitar perfiles sin documentacion requerida.
- solo enviar recordatorios operativos.

## Alcance funcional

### 1) Recordatorio de cuenta no verificada

Enviar recordatorios a usuarios con:

- `user.verified = false`
- email disponible
- sin haber superado el maximo de recordatorios

Ventanas objetivo:

- T+24h
- T+72h
- T+7d

### 2) Recordatorio de certificado de antecedentes pendiente

Enviar recordatorios a profesionales con:

- `requiresDocumentation = true`
- documentacion penal faltante (`criminalRecordObjectKey` nulo)
- sin haber superado el maximo de recordatorios

Ventanas objetivo:

- T+24h
- T+72h
- T+7d

## Arquitectura (patron actual)

```text
scheduler interno (ceres-api)
  ├─ detecta candidatos por query DB
  ├─ evalua ventana/cadencia
  ├─ encola email via OpsEmailQueueService
  └─ registra trazabilidad requested/sent/failed/skipped en ops_event_log
```

No se agrega worker externo ni nueva cola:

- se reutiliza Redis `ops:email:*`
- se reutilizan guardas, sanitizacion y eventos existentes

## Diseno tecnico

## A) Servicio de recordatorios

Crear servicio interno en observabilidad:

- `src/modules/observability/ops-email-reminders.service.ts`

Responsabilidades:

- iniciar ciclo periodico en `onModuleInit`.
- limpiar timer en `onModuleDestroy`.
- buscar candidatos de ambos flujos.
- decidir si corresponde recordatorio por ventana.
- encolar jobs via `OpsEmailQueueService`.
- registrar `skipped` con `reason` cuando aplique.

## B) Scheduling

Sin nuevas variables de entorno en esta fase.

Se define un intervalo fijo interno conservador:

- `const REMINDER_SCAN_INTERVAL_MS = 60 * 60 * 1000` (1h)

Notas:

- idempotencia evita duplicados por scans repetidos.
- si se requiere tuning futuro, se evaluara en fase 2.

## C) Deteccion de candidatos

### C1) Cuentas no verificadas

Fuente: `User`

Condicion base:

- `verified = false`
- email no nulo/no vacio

Campos minimos:

- `id`, `email`, `firstName`, `createdAt`, `verified`

Exclusiones:

- usuarios ya verificados al momento del scan.

### C2) Certificado penal pendiente

Fuente: `Professional` + `ProfessionalDocumentation` + `User`

Condicion base:

- `professional.requiresDocumentation = true`
- `professional.documentation.criminalRecordObjectKey IS NULL`
- email de usuario disponible

Campos minimos:

- `professional.id`, `professional.userId`, `professional.createdAt`
- `user.email`, `user.firstName`

Exclusiones:

- profesionales que ya cargaron documento al momento del scan.

## D) Politica de ventanas y limite

No se crea tabla nueva en MVP.

Se calcula estado desde `ops_event_log`:

- buscar eventos `*.sent` del reminder por entidad.
- contar cantidad enviada.
- tomar timestamp del ultimo envio.

Regla:

- reminder #1: enviar si paso >= 24h del hito base
- reminder #2: enviar si paso >= 72h
- reminder #3: enviar si paso >= 7d
- >3: no enviar mas

Hito base:

- verificacion: `user.createdAt`
- certificado: `professional.createdAt`

## E) Idempotencia

Formato propuesto:

### Verificacion de cuenta

- `reminder.verify_email:<userId>:d1`
- `reminder.verify_email:<userId>:d3`
- `reminder.verify_email:<userId>:d7`

### Certificado penal pendiente

- `reminder.criminal_record:<professionalId>:d1`
- `reminder.criminal_record:<professionalId>:d3`
- `reminder.criminal_record:<professionalId>:d7`

Con esto:

- se previenen duplicados por reinicios.
- se previenen duplicados por concurrencia de scans.

## Templates de email (nuevos)

Agregar templates y contratos:

- `services.reminder_verify_account`
- `services.reminder_missing_criminal_record`

### `services.reminder_verify_account`

Asunto sugerido:

- `Recordatorio: confirma tu cuenta en Ceres en Red`

Payload:

- `firstName?`
- `verificationUrl`

Dominio:

- `auth.email`

Summary:

- `Recordatorio de verificacion para usuario <id>`

### `services.reminder_missing_criminal_record`

Asunto sugerido:

- `Falta cargar tu certificado de antecedentes penales`

Payload:

- `firstName?`
- `documentsUrl`

Dominio:

- `professional.documentation`

Summary:

- `Recordatorio de documentacion para profesional <id>`

## Cambios de contrato/constantes

Actualizar:

- `EMAIL_TEMPLATE_KEYS` en `observability.constants.ts`
- render de templates en `ops-email.templates.ts`
- tipos de templates en DTOs/contratos compartidos

No se agregan endpoints publicos nuevos en MVP.

## Eventos esperados

Por template:

- `services.reminder_verify_account.requested`
- `services.reminder_verify_account.sent`
- `services.reminder_verify_account.failed`
- `services.reminder_verify_account.skipped`

- `services.reminder_missing_criminal_record.requested`
- `services.reminder_missing_criminal_record.sent`
- `services.reminder_missing_criminal_record.failed`
- `services.reminder_missing_criminal_record.skipped`

Metadata recomendada:

- `templateKey`
- `recipient` (enmascarado)
- `providerStrategy`
- `attempts`
- `window` (`d1|d3|d7`)
- `reason` (en skipped)

## Seguridad y negocio

Restricciones explicitas:

- nunca setear `user.verified=true` desde recordatorios.
- nunca relajar validaciones de documentacion por falla de email.
- mantener masking/sanitizacion de metadata.
- preservar control de ruido con eventos `skipped` explicitos.

## Operacion

Validacion operacional:

- `GET /api/v1/ops/events?query=reminder_verify_account`
- `GET /api/v1/ops/events?query=reminder_missing_criminal_record`

Criterios de salud:

- ratio `sent/failed` aceptable por ventana.
- sin crecimiento anomalo en `dead_letter`.

## Plan de implementacion

1. Extender constantes de templates.
2. Implementar templates nuevos.
3. Crear `OpsEmailRemindersService`.
4. Registrar servicio en `ObservabilityModule`.
5. Implementar queries de candidatos.
6. Implementar evaluacion de ventana + limite.
7. Implementar encolado con idempotency por ventana.
8. Emitir `skipped` con `reason` cuando no aplique envio.
9. Tests unitarios de ventana/idempotencia/cap de envios.
10. Test de integracion minimo de encolado de reminder.

## Criterios de aceptacion

- Se generan recordatorios para ambos casos en ventanas definidas.
- No hay duplicados por ventana para una misma entidad.
- Se registran eventos `requested/sent/failed/skipped` con metadata util.
- No se altera la regla de verificacion obligatoria ni de documentacion requerida.
- No se agregan variables de entorno nuevas en esta fase.
