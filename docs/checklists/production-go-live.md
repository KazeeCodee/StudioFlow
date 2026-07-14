# Checklist de go-live de producción

Estado: **NO-GO**

Ninguna casilla está preaprobada. Cada item requiere responsable, fecha UTC y Evidencia enlazada. Los detalles operativos están en los runbooks de Supabase, backup/restore, Railway release e incidentes.

## Identidad del release

| Campo | Valor |
| --- | --- |
| Commit SHA/versión | Pendiente |
| Ventana UTC | Pendiente |
| Release owner | Pendiente |
| Database owner | Pendiente |
| Rollback owner | Pendiente |
| Security owner | Pendiente |
| Canal operativo | Pendiente |
| Registro de Evidencia | Pendiente |

## Código y CI

- [ ] Cero advisories high/critical en dependencias de producción. Dueño/fecha/Evidencia: pendiente.
- [ ] Checkout limpio: `npm ci`, audit, lint, unit, integration, coverage y build verdes. Dueño/fecha/Evidencia: pendiente.
- [ ] Umbrales de cobertura no bajaron del baseline. Dueño/fecha/Evidencia: pendiente.
- [ ] GitHub ruleset exige `CI / quality`, `CI / database` y `Staging E2E / e2e`. Dueño/fecha/Evidencia: pendiente.
- [ ] PR aprobado, branch actualizado y sin pushes directos/force-push. Dueño/fecha/Evidencia: pendiente.

## Staging y datos

- [ ] Supabase staging y producción son proyectos distintos; E2E apunta sólo a staging. Dueño/fecha/Evidencia: pendiente.
- [ ] Migración aditiva aplicada primero a staging y `migration list` alineado. Dueño/fecha/Evidencia: pendiente.
- [ ] Security/Performance Advisors sin errores o warnings aceptados explícitamente. Dueño/fecha/Evidencia: pendiente.
- [ ] Concurrencia: overlap de reservas y double-refund pasan contra PostgreSQL staging. Dueño/fecha/Evidencia: pendiente.
- [ ] E2E completo pasa y limpia usuarios/datos. Dueño/fecha/Evidencia: pendiente.
- [ ] CSP y headers están enforced sobre HTTPS sin violaciones del navegador. Dueño/fecha/Evidencia: pendiente.
- [ ] Redis compartido funciona entre procesos, emite 429 y falla de forma segura. Dueño/fecha/Evidencia: pendiente.
- [ ] Carga conservadora de login/booking respeta límites acordados de latencia, errores, CPU, memoria y conexiones. Dueño/fecha/Evidencia: pendiente.

## Supabase/Auth/Storage

- [ ] Row Level Security y políticas verificadas en toda tabla expuesta. Dueño/fecha/Evidencia: pendiente.
- [ ] `service_role` sólo server-side y ningún secreto aparece en Git/logs/artifacts. Dueño/fecha/Evidencia: pendiente.
- [ ] Dominio/Site URL y Auth redirects exactos; producción no permite localhost ni comodines amplios. Dueño/fecha/Evidencia: pendiente.
- [ ] Password policy, leaked-password protection, rate limits, CAPTCHA y JWT/sesiones decididos y probados. Dueño/fecha/Evidencia: pendiente.
- [ ] Revocación de sesiones demostrada en staging. Dueño/fecha/Evidencia: pendiente.
- [ ] Bucket, MIME/tamaño, RLS y SVG legacy auditados; upload/read/delete staging aprobado. Dueño/fecha/Evidencia: pendiente.

## Recuperación

- [ ] Backup diario vigente y export lógico cifrado off-site. Dueño/fecha/Evidencia: pendiente.
- [ ] Export independiente de objetos Storage reconciliado. Dueño/fecha/Evidencia: pendiente.
- [ ] Database y Storage restaurados en proyecto descartable; RPO/RTO dentro de objetivos. Dueño/fecha/Evidencia: pendiente.
- [ ] Secretos de Database, `service_role`, Redis, cron y email rotados después del ensayo. Dueño/fecha/Evidencia: pendiente.

## Railway y operación

- [ ] Servicios web/cron/Redis son exclusivos de StudioFlow; no se reutiliza otro proyecto. Dueño/fecha/Evidencia: pendiente.
- [ ] Web: `/railway.toml`, una réplica, dominio HTTPS y `/api/health/ready` 200. Dueño/fecha/Evidencia: pendiente.
- [ ] Cron: `/railway.cron.toml`, sin dominio, schedule UTC correcto, termina y deja resumen; retry/idempotencia probados. Dueño/fecha/Evidencia: pendiente.
- [ ] Email real llega a casilla controlada y failures quedan observables. Dueño/fecha/Evidencia: pendiente.
- [ ] Uptime externo, 5xx/latencia, Railway CPU/RAM, deploy/cron alerts llegan a operador real. Dueño/fecha/Evidencia: pendiente.
- [ ] Deployment anterior está disponible y el Rollback owner ensayó el procedimiento. Dueño/fecha/Evidencia: pendiente.
- [ ] Contactos de incidentes primarios/backups y canal seguro fueron probados. Dueño/fecha/Evidencia: pendiente.

## Checkpoint de producción

- [ ] Freeze de schema/config activo. Dueño/fecha/Evidencia: pendiente.
- [ ] Backup dentro del RPO y restore evidenciado. Dueño/fecha/Evidencia: pendiente.
- [ ] Dry-run de migración producción muestra sólo cambios esperados y destino verificado. Dueño/fecha/Evidencia: pendiente.
- [ ] Criterios de rollback, deployment destino, impacto y comunicación anexados. Dueño/fecha/Evidencia: pendiente.
- [ ] Release owner y database owner registran GO explícito. Dueño/fecha/Evidencia: pendiente.

## Ejecución y observación

- [ ] Migración producción aplicada y `migration list` alineado. Dueño/fecha/Evidencia: pendiente.
- [ ] Deploy Railway manual del SHA aprobado termina `SUCCESS` y readiness 200. Dueño/fecha/Evidencia: pendiente.
- [ ] Smoke member/admin, DB, Redis, cron/email y alertas aprobado. Dueño/fecha/Evidencia: pendiente.
- [ ] Observación de 24 horas completa: +15 min, +1 h, +4 h, cron, +12 h y +24 h. Dueño/fecha/Evidencia: pendiente.
- [ ] Notification failures, audit/security logs, conexiones, Redis, recursos y tickets revisados. Dueño/fecha/Evidencia: pendiente.
- [ ] Cierre firmado; autodeploy sigue deshabilitado hasta dos releases exitosos. Dueño/fecha/Evidencia: pendiente.

## Decisión

| Decisión | Release owner | Database owner | Security owner | Fecha UTC | Evidencia |
| --- | --- | --- | --- | --- | --- |
| NO-GO | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Si falta una casilla o su Evidencia, la decisión permanece **NO-GO**.
