# Login Branding Design

**Fecha:** 2026-04-03

**Objetivo**

Actualizar la pantalla de login para que se vea comercialmente presentable, manteniendo `StudioFlow` como nombre del producto y reemplazando el ícono genérico por el branding de KazeCode.

**Decisión aprobada**

Se implementará el enfoque conservador:

- mantener `StudioFlow` como nombre visible del sistema
- reemplazar el ícono genérico por el logo real de KazeCode
- reescribir el contenido de marketing del panel izquierdo para un tono más comercial
- ajustar el texto de bienvenida y ayuda del panel derecho para que suene más profesional y menos interno

**Arquitectura**

El cambio vive en `src/app/(auth)/login/page.tsx`, que ya concentra tanto el hero lateral como el formulario de acceso. No se modificarán acciones de autenticación ni estructura de rutas; el cambio es de branding y copy.

El asset a reutilizar es `public/branding/kazecode-logo.svg`, ya incorporado en el proyecto para el sidebar. Se usará también en el login para sostener consistencia visual entre acceso y aplicación autenticada.

**Comportamiento esperado**

- en desktop y mobile desaparece el ícono genérico actual
- el login muestra el logo de KazeCode junto a `StudioFlow`
- el mensaje principal comunica gestión de reservas, membresías y operación diaria con tono comercial
- el formulario habla de acceso a la cuenta, no de una configuración interna del staff
- no cambia el flujo de login, errores, redirecciones ni validaciones

**Criterios visuales**

- conservar la composición actual porque ya se percibe premium
- usar `SVG` para mantener nitidez
- mantener la paleta actual del producto
- evitar claims exagerados o ajenos al alcance real del sistema

**Riesgos y mitigaciones**

- riesgo: que el logo de KazeCode se vea desproporcionado en el hero
  mitigación: usar `object-contain` y contenedores controlados en desktop y mobile
- riesgo: que el nuevo copy pierda claridad para usuarios existentes
  mitigación: mantener lenguaje simple y orientado a operación, sin eliminar referencias a reservas y membresías
- riesgo: que el cambio quede sin cobertura
  mitigación: agregar un test de render para el login validando branding y copy principal

**Testing**

- prueba de render del login para validar el logo de KazeCode y los textos principales
- ejecución puntual de Vitest sobre el archivo nuevo
