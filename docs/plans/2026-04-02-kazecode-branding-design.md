# KazeCode Branding Design

**Fecha:** 2026-04-02

**Objetivo**

Reemplazar el branding genérico del sidebar por la identidad visual de KazeCode, manteniendo el nombre del producto `StudioFlow` y sumando un crédito permanente y clickeable hacia `https://kazecode.com.ar`.

**Decisión aprobada**

Se implementará la opción 1:

- usar `Logo 1.svg` como marca principal en el header del sidebar
- mantener `StudioFlow` como nombre visible del sistema
- conservar el subtítulo contextual (`Centro operativo` / `Portal del miembro`)
- agregar al final de la barra izquierda un crédito a KazeCode que abra la web externa

**Arquitectura**

El cambio vive principalmente en `src/components/layout/app-shell.tsx`, que ya concentra el header y el footer del sidebar. Los assets se copiarán a `public/branding/` para que Next los sirva de forma estable y simple.

No se cambiará la navegación ni la estructura del contenido principal. El ajuste es estrictamente visual y de marca.

**Comportamiento esperado**

- el ícono genérico actual desaparece
- arriba del sidebar aparece el logo de KazeCode con buena nitidez
- el nombre `StudioFlow` sigue siendo el identificador del producto
- abajo del sidebar aparece un crédito tipo `Desarrollado por KazeCode`
- al hacer click en ese crédito se abre `https://kazecode.com.ar` en una nueva pestaña

**Criterios visuales**

- priorizar el `SVG` para máxima nitidez
- no agregar fondos artificiales si el logo ya resuelve bien solo
- respetar la paleta azul actual del producto para que el cambio se sienta integrado
- mantener legibilidad en desktop y no alterar el layout móvil

**Riesgos y mitigaciones**

- riesgo: que el logo quede demasiado grande o pesado en el sidebar
  mitigación: usar tamaño controlado y `object-contain`
- riesgo: romper tests del shell/layout
  mitigación: actualizar tests de `AppShell` para cubrir branding y crédito

**Testing**

- test de render del `AppShell` validando presencia del branding nuevo
- validación visual local del sidebar en modo admin
- chequeo del link externo de crédito
