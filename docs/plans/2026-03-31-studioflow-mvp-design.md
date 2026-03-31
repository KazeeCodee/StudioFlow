# StudioFlow MVP Design

**Fecha:** 2026-03-31

## Objetivo

Construir una plataforma web para la gestión operativa de un estudio audiovisual con dos vistas dentro del mismo producto:

- panel administrativo para staff
- portal de autogestión para miembros

El MVP debe resolver reservas sin solapamientos, control de cupos, gestión de planes, seguimiento manual de pagos y renovaciones, disponibilidad real por espacio y una experiencia simple tanto para staff como para miembros.

## Alcance del MVP

### Incluido

- autenticación segura con Supabase Auth
- roles diferenciados por tipo de usuario
- creación de miembros por parte del staff
- carga manual de contraseña inicial por staff
- cambio de contraseña desde el perfil del miembro
- gestión de planes y membresías
- gestión de espacios y bloqueos
- motor de reservas con validación real de disponibilidad
- calendario general operativo
- cancelación según política configurable
- renovación manual de membresías
- alertas de vencimiento y seguimiento operativo
- portal del miembro con reservas, cupos y plan activo
- métricas operativas básicas
- auditoría de acciones críticas

### Fuera de alcance inicial

- pagos online
- facturación electrónica
- app móvil nativa
- CRM comercial
- integraciones complejas con WhatsApp
- reportes financieros avanzados
- multi-sucursal avanzada
- marketplace público de espacios

## Estructura del producto

### Vista staff/admin

Panel operativo para `super_admin`, `admin` y `operator`.

Capacidades principales:

- crear y editar planes
- crear miembros y asignarles planes
- definir contraseña inicial de acceso
- registrar pagos manualmente
- renovar vigencias y reiniciar cupos
- corregir cupos si hace falta
- crear y administrar espacios
- configurar disponibilidad y bloqueos
- ver calendario general
- crear, cancelar y revisar reservas
- ver alertas operativas y métricas

### Vista miembro

Portal de autogestión para `member`.

Capacidades principales:

- ver perfil y datos básicos
- ver plan activo
- ver cupos restantes
- ver próxima fecha de pago o control
- reservar espacios disponibles
- cancelar reservas permitidas
- ver historial y próximas reservas
- cambiar contraseña

## Arquitectura técnica

### Stack recomendado

- Next.js con App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Drizzle ORM
- Zod
- React Hook Form

### Criterios de arquitectura

- monolito web moderno para reducir complejidad del MVP
- panel admin y portal miembro dentro de la misma aplicación
- lógica de negocio centralizada en servicios
- validaciones críticas en backend y base de datos, no solo en UI
- estructura modular por dominio para sostener crecimiento futuro

### Estructura sugerida

```text
src/
  app/
    (auth)/
    admin/
      dashboard/
      members/
      spaces/
      bookings/
      plans/
      settings/
    member/
      dashboard/
      bookings/
      plan/
      profile/
    api/
  components/
    ui/
    forms/
    tables/
    calendar/
  modules/
    auth/
    members/
    spaces/
    bookings/
    plans/
    renewals/
    dashboard/
    alerts/
  services/
  lib/
    auth/
    db/
    permissions/
    validations/
    utils/
  types/
```

## Reglas de negocio validadas

### Alta de usuarios

- el staff crea al miembro
- el staff asigna plan y condiciones iniciales
- el staff define la contraseña inicial
- el miembro puede cambiar su contraseña luego desde su perfil

### Planes y cupos

- un plan es una plantilla operativa y comercial
- un miembro tiene una instancia activa del plan en `member_plans`
- los cupos son enteros
- no existen medios cupos ni fracciones
- los cupos representan horas base de reserva

### Espacios

- cada espacio define cuánto cuesta una hora de uso en cupos
- el valor por defecto es `1 cupo por hora`
- espacios premium pueden costar más cupos por hora

### Reservas

- las reservas se toman en bloques enteros de `1 hora`
- una reserva pertenece a un miembro y a un espacio
- no se permiten solapamientos en el mismo espacio
- el sistema valida disponibilidad real antes de confirmar
- el sistema descuenta cupos al confirmar
- el costo de una reserva es `duración en horas x costo por hora del espacio`

### Pagos y renovaciones

- el sistema no procesa pagos
- el sistema monitorea vencimientos y próximos controles
- el staff registra manualmente que el pago fue realizado
- recién al confirmar pago se renuevan vigencia y cupos
- el sistema debe mostrar alertas operativas sobre vencimientos y pagos pendientes

### Cancelaciones

- política base sugerida: cancelación permitida hasta 24 horas antes
- si se cancela dentro de política se puede reintegrar el cupo
- si se cancela fuera de política puede no reintegrarse el cupo
- la política es configurable desde administración

## Modelo de datos del MVP

### `profiles`

Identidad autenticada del usuario.

Campos clave:

- `id`
- `full_name`
- `email`
- `phone`
- `role`
- `status`
- `created_at`
- `updated_at`

### `members`

Ficha operativa del miembro.

Campos clave:

- `id`
- `profile_id`
- `full_name`
- `email`
- `phone`
- `status`
- `notes`
- `created_at`
- `updated_at`

### `spaces`

Espacios reservables.

Campos clave:

- `id`
- `name`
- `slug`
- `description`
- `image_url`
- `capacity`
- `status`
- `hourly_quota_cost`
- `min_booking_hours`
- `max_booking_hours`
- `created_at`
- `updated_at`

### `space_availability_rules`

Horarios base por espacio.

Campos clave:

- `id`
- `space_id`
- `day_of_week`
- `start_time`
- `end_time`
- `is_active`

### `space_blocks`

Bloqueos operativos.

Campos clave:

- `id`
- `space_id`
- `title`
- `reason`
- `starts_at`
- `ends_at`
- `created_by`
- `created_at`

### `plans`

Plantilla del plan.

Campos clave:

- `id`
- `name`
- `description`
- `status`
- `duration_type`
- `duration_value`
- `quota_amount`
- `price`
- `cancellation_policy_hours`
- `max_bookings_per_day`
- `max_bookings_per_week`
- `created_at`
- `updated_at`

### `member_plans`

Instancia activa o histórica del plan sobre un miembro.

Campos clave:

- `id`
- `member_id`
- `plan_id`
- `status`
- `starts_at`
- `ends_at`
- `next_payment_due_at`
- `quota_total`
- `quota_used`
- `quota_remaining`
- `last_renewed_at`
- `renewed_manually`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### `bookings`

Reserva confirmada o histórica.

Campos clave:

- `id`
- `member_id`
- `space_id`
- `member_plan_id`
- `starts_at`
- `ends_at`
- `duration_hours`
- `hourly_quota_cost`
- `quota_consumed`
- `status`
- `cancellation_reason`
- `cancelled_at`
- `cancelled_by`
- `created_by`
- `created_at`
- `updated_at`

### `booking_status_history`

Historial de estados de la reserva.

### `renewals`

Historial de renovaciones manuales.

Campos clave:

- `id`
- `member_id`
- `member_plan_id`
- `renewed_by`
- `renewed_at`
- `old_end_date`
- `new_end_date`
- `old_quota_remaining`
- `new_quota_total`
- `notes`

### `system_settings`

Parámetros configurables del negocio.

### `audit_logs`

Auditoría de acciones críticas.

## Roles y permisos

### `super_admin`

- acceso total
- gestiona usuarios internos, planes, espacios, reservas, settings y métricas

### `admin`

- acceso total operativo
- gestiona miembros, planes, renovaciones, reservas, espacios y alertas

### `operator`

- acceso operativo diario
- puede operar reservas, miembros, espacios y seguimiento
- no modifica configuraciones críticas ni permisos globales

### `member`

- solo accede a su propia información
- ve su plan, cupos, reservas y alertas
- reserva y cancela dentro de las reglas

## Seguridad

- autenticación con Supabase Auth
- rol persistido en `profiles.role`
- permisos validados en backend
- Row Level Security desde el inicio
- la UI oculta acciones, pero la seguridad real vive en backend y base de datos

### Reglas mínimas de RLS

- un miembro solo puede leer su propio perfil
- un miembro solo puede leer sus propias reservas y su plan
- un miembro no puede alterar reservas de terceros
- solo staff puede modificar planes, settings y bloqueos
- solo staff autorizado puede renovar membresías o corregir cupos

## Flujos operativos principales

### Alta de miembro

1. staff crea miembro
2. carga datos personales
3. define contraseña inicial
4. asigna plan
5. el sistema crea usuario, perfil, ficha y plan activo
6. el sistema registra auditoría

### Reserva

1. usuario elige espacio, fecha y bloque horario
2. el sistema valida plan activo, cupos, disponibilidad, bloqueos y solapamientos
3. si todo es válido, crea la reserva
4. descuenta cupos
5. registra historial y auditoría

### Cancelación

1. usuario abre una reserva futura
2. el sistema valida política de cancelación
3. cambia estado
4. reintegra o no los cupos según configuración
5. registra historial y auditoría

### Renovación manual

1. el sistema muestra alertas de próximo vencimiento
2. staff confirma pago por fuera del sistema
3. ejecuta renovación manual
4. el sistema extiende vigencia, reinicia cupos y registra historial

## Fases recomendadas

### Fase 1

- base técnica
- auth
- roles
- estructura del proyecto
- base de datos inicial

### Fase 2

- miembros
- planes
- espacios
- disponibilidad base
- bloqueos

### Fase 3

- motor de reservas
- calendario general
- control de cupos
- cancelaciones

### Fase 4

- renovaciones manuales
- alertas operativas
- seguimiento de vencimientos

### Fase 5

- portal del miembro
- reservas propias
- cambio de contraseña

### Fase 6

- dashboard y métricas operativas

## Criterios de aceptación del MVP

- staff puede crear espacios, planes y miembros
- el miembro puede iniciar sesión
- el miembro puede ver disponibilidad real
- el miembro puede reservar sin generar solapamientos
- el miembro puede cancelar bajo política definida
- staff puede ver el calendario general
- el sistema controla cupos correctamente
- staff puede renovar manualmente membresías
- el sistema muestra alertas y vencimientos
- la seguridad por roles funciona

## Decisiones abiertas para implementación

- definir si los cupos remanentes se reinician o se acumulan al renovar
- definir si `operator` puede renovar miembros o solo `admin`
- definir nivel mínimo de correos automáticos del MVP
- definir si el calendario permitirá drag and drop en la primera versión
