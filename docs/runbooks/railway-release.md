# Release de StudioFlow en Railway

Estado inicial: **NO-GO**. Este runbook no autoriza un deploy. Toda acción en Supabase, Railway, GitHub, DNS, email o monitoreo requiere un checkpoint con evidencia y confirmación explícita.

## Registro de release

| Campo | Valor |
| --- | --- |
| Versión/commit SHA | Pendiente |
| Ventana UTC | Pendiente |
| Release owner | Pendiente |
| Database owner | Pendiente |
| Rollback owner | Pendiente |
| Staging URL | Pendiente |
| Production URL | Pendiente |
| Deployment anterior recuperable | Pendiente |
| Canal de incidentes | Pendiente |
| Evidencia | Pendiente |

No registrar secretos, URLs firmadas, connection strings ni datos personales. Todos los horarios se anotan en UTC.

## 1. Preconditions

- [ ] Commit candidato identificado y worktree limpio.
- [ ] PR aprobado y checks requeridos verdes.
- [ ] Staging y producción son entornos separados en Railway y Supabase.
- [ ] Autodeploy de producción deshabilitado; deploy manual.
- [ ] Web usa `/railway.toml`, una réplica inicial y healthcheck `/api/health/ready`.
- [ ] Cron usa `/railway.cron.toml`, no tiene dominio público, corre `0 12 * * *` UTC y termina al completar.
- [ ] Redis compartido de StudioFlow existe; no reutiliza la instancia de otro proyecto.
- [ ] Backup/restore y contactos de incidente están aprobados.
- [ ] La versión anterior continúa dentro de la retención y permite rollback en Railway.

Si cualquiera falta, decisión **NO-GO**.

## 2. Verificación desde checkout limpio

Crear un checkout limpio del SHA candidato fuera del directorio de trabajo habitual. No copiar `.env.local`; inyectar sólo configuración de test/staging desde el gestor de secretos.

```bash
npm ci
npm audit --omit=dev
npm run lint
npm test
npm run test:integration
npm run test:coverage
npm run test:e2e
npm run build
```

Los E2E requieren `.env.e2e.local`, `E2E_ALLOW_MUTATIONS=true`, refs staging/producción distintos y sólo se ejecutan contra staging. Adjuntar logs sanitizados, versiones Node/npm/Supabase y resumen de cobertura.

| Gate | Resultado | Inicio/fin UTC | Operador | Evidencia |
| --- | --- | --- | --- | --- |
| Audit | Pendiente | Pendiente | Pendiente | Pendiente |
| Lint/unit/integration | Pendiente | Pendiente | Pendiente | Pendiente |
| Coverage | Pendiente | Pendiente | Pendiente | Pendiente |
| E2E staging | Pendiente | Pendiente | Pendiente | Pendiente |
| Build | Pendiente | Pendiente | Pendiente | Pendiente |

## 3. Ensayo completo en staging

Acción externa: presentar SHA, dry-run de migraciones, backups disponibles, operadores y rollback antes de continuar.

Orden obligatorio:

1. Enlazar y verificar el ref Supabase de staging.
2. Ejecutar `supabase migration list --linked` y `supabase db push --linked --dry-run`.
3. Con aprobación, aplicar la migración aditiva y volver a listar migraciones.
4. Desplegar web y cron del mismo SHA en Railway staging.
5. Esperar deploy exitoso; Railway debe obtener HTTP 200 de `/api/health/ready` antes de enrutar tráfico.
6. Ejecutar los checks siguientes y guardar Evidencia.

| Check staging | Criterio | Resultado/Evidencia |
| --- | --- | --- |
| Liveness/readiness | `/api/health/live` y `/api/health/ready` 200; readiness falla de forma controlada si DB no está disponible | Pendiente |
| Member smoke | Login, listado, reserva, cancelación/refund correcto | Pendiente |
| Admin smoke | Login, miembro, espacio, plan y renovación | Pendiente |
| Concurrencia | Overlap y double-refund bloqueados por PostgreSQL | Pendiente |
| E2E | Suite completa sólo en staging, limpieza confirmada | Pendiente |
| CSP/headers | HTTPS sin violaciones; pasar de report-only a enforce y repetir | Pendiente |
| Rate limit | Redis compartido limita entre procesos y falla de forma segura | Pendiente |
| Cron | Ejecución manual controlada termina, cierra conexiones y deja resumen JSON | Pendiente |
| Email | Entrega real a casilla staging, sin destinatarios de producción | Pendiente |
| Advisors | Sin errores; warnings aceptados | Pendiente |

Railway no usa el healthcheck como monitor continuo. Debe existir un monitor externo de uptime para `/api/health/live` y otro chequeo controlado de readiness.

## 4. Prueba de carga conservadora

No improvisar carga contra producción. Definir y aprobar antes usuarios sintéticos, volumen, duración y límites. Ejecutar sólo en staging y detener ante corrupción, errores de integridad, 5xx sostenidos o saturación.

Perfil inicial seguro para acordar, no un valor automático: calentamiento de 2 minutos; rampa gradual; pocas sesiones concurrentes; máximo 10 minutos; sólo login y disponibilidad/reserva de datos sintéticos con limpieza. No probar fuerza bruta ni enviar email real.

| Métrica | Límite acordado antes de correr | Resultado | Evidencia |
| --- | --- | --- | --- |
| Error rate/5xx | Pendiente | Pendiente | Pendiente |
| p95 login | Pendiente | Pendiente | Pendiente |
| p95 booking | Pendiente | Pendiente | Pendiente |
| CPU/memoria web | Pendiente | Pendiente | Pendiente |
| Conexiones DB | Pendiente | Pendiente | Pendiente |
| Redis/429 | Pendiente | Pendiente | Pendiente |
| Integridad final | Cero overlap/doble refund | Pendiente | Pendiente |

La Evidencia debe incluir configuración de carga, timestamps, SHA, métricas Railway, DB, Redis y consultas de integridad posteriores.

## 5. Monitoreo y alertas

- [ ] Uptime externo consulta desde fuera de Railway y alerta por canal real.
- [ ] Railway Observability tiene CPU, RAM, red, logs web/cron/Redis y monitores acordados.
- [ ] Aplicación externa cubre latencia, error rate/5xx y flujos; Railway no provee esas métricas de aplicación por sí solo.
- [ ] Webhook de deploy failed/crash llega al canal operativo.
- [ ] Prueba de alerta fue recibida y reconocida por un operador real.
- [ ] Logs estructurados filtran por request/deployment y no contienen secretos o PII innecesaria.

| Alerta | Umbral | Destino | Operador/backup | Prueba UTC | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Uptime | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| 5xx/latencia | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| CPU/RAM | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Deploy/cron | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## 6. Checkpoint de producción

Antes de cualquier acción externa presentar:

- SHA y diff del release;
- outputs sanitizados de todos los gates de staging;
- resultado de carga y alertas;
- `supabase migration list` y dry-run para producción;
- backup Database + Storage y restore ensayado con RPO/RTO;
- ID del deployment Railway anterior recuperable;
- criterios de rollback, owners y canal activo;
- ventana, impacto esperado y plan de comunicación.

Congelar cambios de schema/config durante la ventana. Release owner y database owner deben registrar GO; si hay duda, **NO-GO**.

## 7. Ejecución de producción

Sólo después de confirmación explícita:

1. Verificar nuevamente entorno, dominio, refs y SHA; dos personas leen el destino.
2. Confirmar backup reciente dentro del RPO y freeze activo.
3. Aplicar exclusivamente las migraciones mostradas por el dry-run; guardar salida y `migration list` posterior.
4. Desplegar manualmente el servicio web del SHA aprobado. No cambiar variables salvo las listadas en el release.
5. Esperar healthcheck `/api/health/ready` 200 y deployment `SUCCESS`.
6. Ejecutar smoke mínimo member/admin con cuentas de prueba controladas, sin borrar datos reales.
7. Verificar Redis, cron programado, email de prueba autorizado, logs, 5xx, conexiones y alertas.
8. Mantener el cron sin ejecución manual si podría duplicar la ventana; si se prueba, confirmar idempotencia y terminación.

Registrar cada acción, operador, timestamp UTC, deployment ID y Evidencia.

## 8. Rollback

Triggers inmediatos: error de integridad, auth generalizado, 5xx por encima del límite, readiness fallido, conexiones DB agotadas, rate limit inseguro, cron/email roto o filtración de secretos.

1. Incident Commander pausa nuevas acciones y declara incidente.
2. Rollback owner selecciona en Railway el deployment exitoso anterior y confirma **Rollback**. Railway restaura imagen y variables de ese deployment; verificar que esto coincide con el plan.
3. Confirmar healthcheck y smoke; vigilar logs/metrics.
4. Pausar cron o email si agravan el incidente.
5. Preservar datos/evidencia y evaluar compatibilidad del código anterior con el schema aditivo.
6. Para Database: nunca revertir una migración de datos a ciegas. Preferir roll-forward; cualquier reparación/reversión requiere análisis SQL, backup verificable, database owner y aprobación separada.
7. Comunicar estado y siguiente actualización.

| Trigger | Hora UTC | Decisión | Deployment destino | Operador | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## 9. Observación de 24 horas

Durante 24 horas desde el deploy registrar al menos: +15 min, +1 h, +4 h, siguiente cron, +12 h y +24 h.

- health/readiness y uptime;
- auth failures, 5xx y latencia;
- reservas, overlaps, cancelaciones y refunds;
- notification failures, entrega email y salida del cron;
- conexiones DB, advisors/audit logs y eventos de seguridad;
- Redis, CPU, memoria y reinicios;
- tickets de usuarios y cambios de configuración.

| Check | Operador | Resultado | Evidencia |
| --- | --- | --- | --- |
| +15 min | Pendiente | Pendiente | Pendiente |
| +1 h | Pendiente | Pendiente | Pendiente |
| +4 h | Pendiente | Pendiente | Pendiente |
| Cron | Pendiente | Pendiente | Pendiente |
| +12 h | Pendiente | Pendiente | Pendiente |
| +24 h | Pendiente | Pendiente | Pendiente |

Cerrar el release sólo con 24 horas estables, incidentes resueltos y checklist firmado. Mantener deploy manual hasta dos releases exitosos.

## Referencias oficiales

- [Railway Healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Deployment Actions y rollback](https://docs.railway.com/deployments/deployment-actions)
- [Cron Jobs](https://docs.railway.com/cron-jobs)
- [Observability Dashboard](https://docs.railway.com/observability)
- [Railway Metrics](https://docs.railway.com/observability/metrics)
