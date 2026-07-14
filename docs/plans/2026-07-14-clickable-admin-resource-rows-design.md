# Navegación a detalles administrativos

**Fecha:** 2026-07-14

## Objetivo

Permitir que un administrador abra de forma evidente el detalle de cualquier espacio, plan o miembro desde su listado, haciendo clic en toda la fila o tarjeta correspondiente.

## Estado actual

Las rutas de detalle ya existen:

- `/admin/spaces/[spaceId]`
- `/admin/plans/[planId]`
- `/admin/members/[memberId]`

Estas pantallas ya contienen la información ampliada y las operaciones de edición, cambio de estado, ocultamiento y eliminación condicionada. En los listados, sin embargo, solamente el nombre funciona como enlace. El resto de la fila parece pertenecer al mismo elemento, pero no navega, por lo que el acceso al detalle resulta difícil de descubrir.

## Diseño aprobado

La fila completa de cada espacio, plan y miembro será interactiva. En la vista de tarjetas de espacios se conservará el enlace de tarjeta completa que ya existe.

Cada fila tendrá:

- navegación al detalle al hacer clic en cualquier zona libre de controles
- cursor y cambio visual al pasar el puntero
- foco visible y navegación mediante teclado
- una indicación visual de avance, como una flecha o texto `Ver detalle`
- un destino accesible identificable como enlace

No se duplicarán los formularios ni las operaciones en el listado. Editar, pausar u ocultar, reactivar y eliminar seguirán en la pantalla de detalle para evitar acciones destructivas accidentales.

## Comportamiento de estado

`Pausar` y `ocultar` representan la misma decisión operativa y no crean un estado nuevo:

- espacios y miembros usan el estado inactivo existente
- planes usan el estado no disponible existente, conservando su semántica y su historial
- las entidades pueden reactivarse desde su detalle cuando el modelo actual lo permita

## Arquitectura

Se extraerá un patrón reutilizable para filas navegables en lugar de repetir controladores de clic y teclado en tres páginas. El componente recibirá el destino, una etiqueta accesible y el contenido de las celdas. La navegación usará las APIs de enrutamiento compatibles con Next.js 16.2.1.

Las páginas de espacios, planes y miembros conservarán sus consultas de servidor. Solo delegarán el comportamiento interactivo de cada fila al componente reutilizable.

## Accesibilidad

- la navegación principal será un enlace real o un patrón equivalente con semántica de enlace
- `Enter` permitirá abrir el detalle desde el teclado
- el foco tendrá una señal visible
- los indicadores decorativos no duplicarán anuncios del lector de pantalla
- futuros controles dentro de una fila no deberán activar la navegación de la fila

## Manejo de errores

Las rutas de detalle mantienen el manejo actual de permisos y recursos inexistentes. Esta iteración no cambia consultas, mutaciones ni reglas de eliminación.

## Pruebas

La implementación seguirá TDD y cubrirá:

- destino correcto para una fila de espacio
- destino correcto para una fila de plan
- destino correcto para una fila de miembro
- señal accesible de `Ver detalle`
- interacción por teclado, si el patrón elegido requiere controladores propios
- conservación del enlace de tarjeta completa en la vista de espacios

También se ejecutarán las pruebas unitarias relacionadas, lint y una verificación visual de los tres listados y sus rutas de detalle.

## Fuera de alcance

- rediseñar las pantallas de detalle existentes
- mover acciones destructivas a los listados
- crear nuevos estados de negocio
- cambiar permisos administrativos o reglas de eliminación

## Resultado esperado

Al seleccionar visualmente un espacio, plan o miembro desde el panel administrativo, el sistema abre el detalle exacto de ese registro. Desde allí el administrador puede usar las acciones que ya existen sin tener que descubrir que únicamente el texto del nombre era clickeable.
