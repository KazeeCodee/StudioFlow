# Correccion de guardado de recursos administrativos

## Objetivo

Corregir la creacion de espacios, planes y miembros para que un formulario valido escriba el registro y navegue al recurso creado, sin reemplazar la interfaz por la pantalla generica de error de Next.js.

## Alcance

- Normalizar el campo de imagen vacio de espacios como ausencia de archivo.
- Modelar los errores esperables de los tres formularios como estado serializable en vez de excepciones sin manejar.
- Mostrar el mensaje dentro del formulario y deshabilitar el boton mientras se guarda.
- Redirigir al detalle del recurso solamente despues de completar la escritura.
- Mantener autenticacion, permisos y reglas de negocio existentes.

## Enfoque

Las acciones de creacion recibiran el estado anterior requerido por `useActionState` y devolveran un estado de error cuando falle la validacion o una dependencia. Los componentes de formulario seran componentes cliente que renderizan ese estado con `role="alert"`. Los fallos inesperados se registraran en el servidor y se traduciran a un mensaje seguro.

En espacios, un `File` de cero bytes se tratara como el valor vacio que genera un control de archivo sin seleccion, independientemente del nombre marcador que llegue desde la serializacion. Los archivos reales conservaran las validaciones de tipo, extension y tamano.

## Exito verificable

- Crear un espacio sin seleccionar imagen no intenta subir archivos y completa la transaccion.
- Crear un plan valido completa la insercion.
- Crear un miembro valido completa la creacion de Auth, perfil, miembro y plan asociado.
- Cada creacion redirige al detalle del identificador devuelto.
- Un fallo controlado permanece en el formulario y no activa el error global.

