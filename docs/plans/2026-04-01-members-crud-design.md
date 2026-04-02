# Members CRUD Design

**Fecha:** 2026-04-01

## Objetivo

Completar el CRUD operativo de miembros para que el staff pueda administrar un miembro existente sin salir del panel, cubriendo:

- detalle de miembro
- edición de ficha
- cambio de estado
- ajuste manual de cupos
- cambio de plan

## Alcance de esta iteracion

### Incluido

- nueva pantalla `admin/members/[memberId]`
- acceso desde el listado de miembros al detalle
- consulta consolidada del miembro con perfil, plan activo y historial reciente de planes
- edicion de datos base del miembro
- sincronizacion de cambios entre `members` y `profiles`
- cambio de estado sincronizado entre ficha y cuenta
- ajuste manual de cupos sobre el plan activo
- cambio de plan con cierre del plan activo previo
- auditoria de todas las acciones administrativas

### No incluido

- gestion avanzada de usuarios internos
- recuperacion de contrasena
- historial completo de auditoria visible en UI
- renovacion manual desde la pantalla de miembro
- reprogramacion de reservas asociadas a cambio de plan

## Estado actual

Hoy el sistema ya permite:

- listar miembros en `src/app/admin/members/page.tsx`
- crear miembros con plan inicial
- persistir `profiles`, `members` y `member_plans`
- renovar manualmente un plan desde otro modulo

Lo que falta es la capa operativa para administrar un miembro ya existente. La base de datos actual ya soporta ese flujo con `members`, `profiles`, `member_plans`, `plans`, `renewals` y `audit_logs`.

## Enfoque elegido

Se va a trabajar sobre una pantalla de detalle de miembro con acciones separadas y auditables en vez de intentar resolver todo con un formulario unico gigante.

### Por que este enfoque

- reduce riesgo operativo: cada accion tiene validacion y semantica clara
- evita mezclar cambios de ficha con cambios de plan o cupos
- permite reutilizar patrones ya presentes en renovaciones manuales
- facilita testing unitario de reglas puntuales

## UX propuesta

### Ruta nueva

- `src/app/admin/members/[memberId]/page.tsx`

### Estructura de la pantalla

1. encabezado con nombre, email, estado actual y plan activo
2. resumen con cupos, vigencia y proximos datos operativos
3. formulario de edicion de ficha
4. accion de cambio de estado
5. accion de ajuste manual de cupos
6. accion de cambio de plan
7. tabla breve de historial reciente de planes

### Principios de UX

- acciones cerradas y explicitas
- sin campos ambiguos que mezclen operaciones distintas
- cada accion pide nota opcional para dejar contexto en auditoria
- navegacion simple desde listado a detalle

## Modelo operativo

### Edicion de ficha

Actualiza:

- `profiles.full_name`
- `profiles.phone`
- `profiles.status`
- `members.full_name`
- `members.phone`
- `members.notes`
- `members.status`

El email no se edita en esta iteracion para no abrir todavia el frente de sincronizacion con Supabase Auth.

### Cambio de estado

El estado se cambia con una accion dedicada. Debe quedar alineado entre `profiles.status` y `members.status`.

Estados soportados:

- `active`
- `inactive`
- `suspended`

### Ajuste manual de cupos

Se aplicara sobre el plan activo del miembro.

Regla elegida:

- el operador ingresa un delta positivo o negativo
- el sistema ajusta `quota_total` y `quota_remaining`
- `quota_used` no cambia
- `quota_remaining` no puede quedar negativa
- `quota_total` no puede quedar menor que `quota_used`

Esto deja trazabilidad clara del ajuste sin reescribir artificialmente el uso historico.

### Cambio de plan

Regla elegida:

- el plan activo actual se marca como `cancelled`
- se crea un nuevo `member_plan` activo
- la nueva vigencia arranca en el momento del cambio
- la nueva cuota se inicializa con `plans.quota_amount`
- `next_payment_due_at` y `ends_at` se recalculan con la duracion del nuevo plan

No se intentara prorratear ni transferir remanentes en esta iteracion. Esa regla es mejor dejarla explicita mas adelante si el negocio la necesita.

## Capa de datos

### Nuevas consultas

En `src/modules/members/queries.ts` se agregaran consultas para:

- obtener detalle completo de un miembro
- listar opciones de estado
- listar historial reciente de planes del miembro

### Nuevas acciones

En `src/modules/members/actions.ts` se agregaran acciones separadas para:

- editar ficha
- cambiar estado
- ajustar cupos
- cambiar plan

Cada accion debe:

- validar auth de staff con `requireStaffContext()`
- validar input con Zod
- ejecutar transaccion si toca multiples tablas
- registrar auditoria
- revalidar `admin/members` y `admin/members/[memberId]`

### Servicios de negocio

Se extraeran servicios en `src/services/members/` para mantener reglas fuera de la accion:

- `update-member-profile.ts`
- `adjust-member-quota.ts`
- `change-member-plan.ts`

Esto mantiene consistencia con el estilo actual del proyecto, donde la logica sensible vive en `services/`.

## Manejo de errores

- si el miembro no existe, la ruta responde con `notFound()`
- si no hay plan activo para ajustar cupos, se lanza error controlado
- si el plan nuevo no existe o no es elegible, se lanza error controlado
- si un ajuste deja cupos invalidos, la validacion bloquea la operacion
- si el actor no es staff, la accion redirige por `requireStaffContext()`

## Testing

La implementacion se valida con TDD sobre reglas puras y helpers del dominio.

### Cobertura minima

- calculo de fechas al cambiar plan
- snapshot del ajuste manual de cupos
- validacion de limites de cupos
- preservacion de `quota_used`
- cancelacion del plan previo y creacion del nuevo snapshot

### Verificacion funcional

- navegar desde listado a detalle
- editar datos y verlos reflejados
- cambiar estado y ver badge actualizado
- ajustar cupos y ver resumen actualizado
- cambiar plan y ver nuevo plan activo en la pantalla

## Riesgos y mitigaciones

### Riesgo: dos planes activos a la vez

Mitigacion:

- cambio de plan dentro de una sola transaccion
- cancelar plan previo antes de insertar el nuevo

### Riesgo: ajuste invalido de cupos

Mitigacion:

- helper que centraliza reglas de `quota_total`, `quota_remaining` y `quota_used`
- tests unitarios de limites

### Riesgo: divergencia entre `profiles` y `members`

Mitigacion:

- toda actualizacion de ficha/estado sincroniza ambas tablas en la misma transaccion

## Resultado esperado

Al cerrar esta iteracion, el staff podra abrir cualquier miembro desde el listado y operarlo de punta a punta sin tocar base de datos manualmente ni depender de otros modulos para tareas diarias.
