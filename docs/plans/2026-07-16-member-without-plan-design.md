# Alta de miembros sin plan

## Objetivo

Permitir que el staff cree un miembro sin asignarle un plan, con una confirmación explícita antes de guardar. El plan podrá asignarse posteriormente desde la ficha existente del miembro.

## Experiencia de usuario

- El selector de plan deja de ser obligatorio e incluye una opción visible para no asignar un plan.
- Si el usuario selecciona un plan, el formulario se envía directamente como hasta ahora.
- Si deja el plan vacío y presiona **Crear miembro**, se abre un modal de advertencia.
- El modal explica que el miembro se creará sin plan y que podrá asignarse después.
- **Volver al formulario** cierra el modal sin enviar el formulario y conserva todos los campos cargados.
- **Crear sin plan** confirma el envío y completa el alta.

## Arquitectura y flujo de datos

El formulario pasa a ser un componente cliente para poder interceptar el envío y controlar el modal. La acción de servidor continúa siendo la autoridad final: normaliza el valor vacío del selector y valida `planId` como UUID opcional.

El servicio de alta conserva el flujo actual de Supabase Auth, perfil y miembro. Cuando hay un plan válido, también crea el registro de `member_plans` y su cuota inicial. Cuando no hay plan, omite ese registro y deja constancia en la auditoría con valores nulos para el plan.

No se requiere migración: la tabla `members` no depende de `member_plans`, y el listado y la ficha ya presentan correctamente el estado sin plan.

## Errores y seguridad

- Un identificador de plan informado debe seguir siendo un UUID válido y corresponder a un plan existente.
- La ausencia de plan es válida; un identificador inválido no lo es.
- La autorización del staff y la creación privilegiada del usuario permanecen exclusivamente en el servidor.
- Si falla la transacción de base de datos, se elimina el usuario recién creado en Supabase Auth, igual que en el flujo actual.

## Pruebas

- Validación del esquema con y sin `planId`, incluyendo identificadores inválidos.
- Comportamiento del formulario: envío directo con plan, apertura del modal sin plan, cancelación con datos preservados y confirmación del envío.
- Lógica del servicio para decidir si corresponde crear una asignación inicial de plan.
- Pruebas existentes, lint y compilación completa.
