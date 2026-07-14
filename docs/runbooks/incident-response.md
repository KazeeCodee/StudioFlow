# Respuesta a incidentes de StudioFlow

## Activación y severidad

Abrir un incidente ante degradación, pérdida/corrupción de datos, acceso no autorizado, secreto expuesto, auth generalizado, 5xx sostenidos, readiness fallido o cron/email con impacto.

| Nivel | Criterio | Respuesta inicial | Actualización |
| --- | --- | --- | --- |
| SEV-1 | Seguridad o pérdida/corrupción activa; app/auth indisponible para la mayoría | 15 min | Cada 30 min |
| SEV-2 | Función crítica degradada, 5xx elevados, cron/email con impacto relevante | 30 min | Cada 60 min |
| SEV-3 | Impacto limitado o workaround estable | 1 día hábil | Según cambio material |

Si no se conoce el impacto, comenzar con la severidad mayor razonable y reducirla con Evidencia.

## Roles y contactos

No inventar contactos. Completar antes del go-live y probar el canal.

| Rol | Primario | Backup | Canal seguro | Última prueba UTC |
| --- | --- | --- | --- | --- |
| Incident Commander | Pendiente | Pendiente | Pendiente | Pendiente |
| Technical lead | Pendiente | Pendiente | Pendiente | Pendiente |
| Database owner | Pendiente | Pendiente | Pendiente | Pendiente |
| Security owner | Pendiente | Pendiente | Pendiente | Pendiente |
| Communications | Pendiente | Pendiente | Pendiente | Pendiente |
| Railway/Supabase billing owner | Pendiente | Pendiente | Pendiente | Pendiente |

Incident Commander coordina y decide; technical lead diagnostica; un operador distinto ejecuta cambios cuando sea posible; communications mantiene mensajes internos/externos. Nadie comparte credenciales por el canal del incidente.

## Primeros 15 minutos

1. Crear ID, declarar severidad, Incident Commander y canal.
2. Registrar inicio UTC, síntoma, detector, alcance conocido y último cambio/deployment.
3. Congelar deploys, migraciones y rotaciones no relacionadas.
4. Confirmar desde dos fuentes: uptime/usuario y logs/metrics.
5. Proteger evidencia antes de reiniciar o hacer rollback.
6. Elegir contención reversible de menor alcance.
7. Publicar mensaje inicial con impacto, mitigación y próxima actualización; no especular.

Plantilla:

```text
[INC-ID][SEV-N] Inicio UTC: <hora>. Impacto confirmado: <qué/quién>.
Estado: investigando|contenido|recuperando. Acción actual: <acción>.
Próxima actualización UTC: <hora>. Incident Commander: <persona/canal>.
```

## Triage y evidencia

- Railway: deployment IDs, SHA, estado, logs web/cron, CPU/RAM/red, reinicios y healthcheck.
- Aplicación: request IDs, rutas/estados agregados, errores sanitizados y timestamps.
- Supabase: conexiones, queries lentas, advisors, Auth/audit y migration list.
- Redis: conectividad, memoria, errores y comportamiento multi-proceso.
- Negocio: reservas/refunds afectados, notificaciones fallidas y usuarios impactados.

Exportar sólo lo necesario, limitar acceso y retención, y no incluir secretos, tokens, cookies, connection strings, cuerpos de email ni PII innecesaria. No pegar dumps o datos de usuarios en el chat del incidente.

| Hora UTC | Observación/Evidencia | Hipótesis | Acción/resultado | Operador |
| --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## Contención general

Prioridad: seguridad e integridad, luego disponibilidad.

- Detener autodeploy y congelar schema/config.
- Si el último deploy coincide con el inicio, hacer rollback Railway a la última versión exitosa compatible.
- Pausar cron/email o una ruta afectada si amplifica daño.
- Reducir tráfico/función de forma controlada; no ocultar readiness fallido.
- No ejecutar SQL destructivo ni revertir migraciones de datos a ciegas.
- Si se sospecha pérdida, preservar backups y dejar de escribir sólo con decisión del Incident Commander/database owner.

## Playbooks por escenario

### Auth o secretos comprometidos

1. Tratar como SEV-1 hasta delimitar alcance.
2. Revocar la credencial expuesta y sesiones afectadas con orden controlado; no publicarla en el ticket.
3. Actualizar consumidores uno por uno y validar smoke antes de invalidar el anterior cuando el riesgo lo permita.
4. Rotar Database, `service_role`, Redis, cron y email según alcance; revisar GitHub/Railway/Supabase audit logs.
5. Corregir origen de exposición, buscar uso indebido, invalidar artifacts/logs accesibles y notificar según obligación legal.

### Database o Storage

1. Pausar escrituras/cron que agravan el problema.
2. Capturar último cambio y reconciliar conteos/integridad.
3. Rollback de app primero si conserva compatibilidad.
4. Elegir roll-forward SQL probado. Restore sólo con backup verificado, RPO/RTO e impacto de downtime aprobados.
5. Database y Storage se recuperan por separado; validar metadata, objetos, RLS y muestra de archivos.

### Redis/rate limit

1. Confirmar si el fallo abre tráfico sin límite o lo bloquea de forma segura.
2. Restaurar la instancia compartida de StudioFlow, revisar memoria/conectividad y mantener una sola réplica web si el control distribuido no está demostrado.
3. Probar 429 y recuperación entre procesos antes de cerrar.

### Cron/email

1. Pausar cron o cambiar email a modo log si hay duplicados, destinatarios incorrectos o proceso colgado.
2. Confirmar ejecución activa: Railway omite la siguiente si la anterior no terminó.
3. Reconciliar `notification_deliveries`, reintentar sólo operaciones idempotentes y no duplicar mensajes.
4. Validar que conexiones cierran y el proceso termina antes de reactivar el schedule.

### Deploy/readiness/5xx

1. Comparar inicio con deployment ID/SHA y variables del deploy.
2. Rollback Railway al deployment exitoso anterior.
3. Confirmar `/api/health/live`, `/api/health/ready`, smoke member/admin, DB y Redis.
4. Mantener monitoreo reforzado y registrar si el rollback restauró variables incompatibles.

## Recuperación y cierre

- [ ] Causa/trigger contenidos.
- [ ] Integridad y seguridad verificadas.
- [ ] Health/readiness, auth, member/admin, Redis, cron/email y alertas aprobados.
- [ ] Backlog/reintentos reconciliados sin duplicados.
- [ ] Usuarios/stakeholders reciben cierre y acciones siguientes.
- [ ] Evidencia preservada con acceso/retención definidos.
- [ ] Seguimiento de 24 horas asignado.

El Incident Commander reduce severidad o cierra sólo con technical/database/security owners según alcance.

## Postmortem

Realizarlo sin culpa dentro de 5 días hábiles para SEV-1/SEV-2.

| Campo | Contenido |
| --- | --- |
| Resumen e impacto | Pendiente |
| Timeline UTC | Pendiente |
| Detección y tiempo a reconocer | Pendiente |
| Causa raíz y contribuyentes | Pendiente |
| Qué funcionó/no funcionó | Pendiente |
| Datos afectados y reconciliación | Pendiente |
| Comunicación | Pendiente |
| Acciones con dueño/fecha/prioridad | Pendiente |
| Prueba que evita regresión | Pendiente |

No cerrar acciones como “monitorear mejor”: cada una debe tener cambio verificable, dueño, fecha y criterio de aceptación.
