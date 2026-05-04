# Staff Panel Density Design

**Fecha:** 2026-04-02

**Objetivo**

Reducir la altura visual y la sensación de exceso de texto en el panel staff, especialmente en el header general, la pantalla de usuarios internos y la pantalla de configuración, sin volver la interfaz críptica.

**Decisión aprobada**

Se implementará un enfoque equilibrado:

- resumir títulos y bajadas donde hoy repiten información
- eliminar textos de ayuda que no agregan criterio operativo
- conservar solo el microcopy que explica impacto real de negocio o uso
- compactar ligeramente spacing vertical en headers y cards densas

**Arquitectura**

El ajuste se concentrará en `src/components/layout/page-header.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/users/page.tsx` y `src/app/admin/settings/page.tsx`.

No cambiaremos flujos, permisos, acciones ni estructura de datos. El trabajo es de copy y densidad visual dentro de la UI existente.

**Criterios de copy**

- si un texto repite lo que ya dice el título, se resume o se elimina
- si un texto aclara una consecuencia operativa concreta, se conserva pero más corto
- si un texto solo decora o rellena, se elimina

**Criterios de layout**

- reducir separación entre eyebrow, título y subtítulo del header
- bajar padding vertical en cards con mucho contenido
- acortar ayudas debajo de inputs para que el botón de acción suba visualmente
- mantener la legibilidad en mobile y desktop

**Comportamiento esperado**

- el encabezado staff se ve más directo y liviano
- `Usuarios internos` mantiene contexto, pero con una bajada más corta
- `Configuración` conserva orientación operativa sin párrafos largos
- `Reglas globales` ocupa menos alto y se entiende más rápido

**Riesgos y mitigaciones**

- riesgo: quitar demasiado contexto y volver ambigua la UI
  mitigación: conservar microcopy en campos con impacto operativo
- riesgo: introducir inconsistencias entre headers del staff
  mitigación: aplicar el mismo criterio en shell, secciones internas y cards
- riesgo: romper tests al cambiar copy
  mitigación: actualizar o agregar tests para el texto compacto esperado

**Testing**

- test del header/layout para validar el copy nuevo del shell staff
- test de `Usuarios internos` para validar la descripción resumida
- test de `Configuración` para validar que desaparece el copy redundante y queda el microcopy compacto esperado
