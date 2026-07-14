# Supabase: preparación de staging y producción

Estado inicial: **NO-GO**. Este runbook registra el procedimiento; no acredita que los controles externos estén completos. Cada casilla requiere responsable, fecha UTC y enlace o archivo de evidencia sin secretos.

## Alcance y reglas

- Usar proyectos Supabase distintos para staging y producción. Nunca probar E2E contra producción.
- Ejecutar primero en staging y promover a producción sólo mediante un checkpoint aprobado.
- No pegar tokens, contraseñas, connection strings, claves `service_role` ni capturas que las muestren en tickets o logs.
- `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente server-side. Nunca usarla en variables `NEXT_PUBLIC_*` ni entregarla al navegador.
- Toda acción de Dashboard, `supabase link`, `db push`, cambio de Auth o rotación es externa: detenerse, presentar objetivo/evidencia y obtener confirmación.

## Registro del entorno

| Campo | Staging | Producción |
| --- | --- | --- |
| Project ref | `STAGING_PROJECT_REF` | `PRODUCTION_PROJECT_REF` |
| Organización | Pendiente | Pendiente |
| Región/Postgres | Pendiente | Pendiente |
| URL de aplicación | Pendiente | Pendiente |
| Responsable | Pendiente | Pendiente |
| Fecha UTC | Pendiente | Pendiente |
| Evidencia | Pendiente | Pendiente |

Condición: ambos refs deben ser distintos. El ref de producción se usa como guarda de los E2E, nunca como destino.

## 1. Preflight local

Estos comandos son locales y no requieren credenciales:

```bash
npx supabase --version
npx supabase db start
npx supabase migration list --local
npm run test:integration
```

Confirmar que la lista local contiene, en orden, todas las migraciones versionadas de `supabase/migrations/`, incluida `20260713035853_booking_integrity_and_storage_hardening.sql`.

- [ ] Stack local sano.
- [ ] Migraciones locales completas y ordenadas.
- [ ] Integración sobre PostgreSQL local aprobada.
- Responsable/fecha UTC:
- Evidencia:

## 2. Migrar staging

Requiere el checkpoint externo. Trabajar desde un checkout limpio del commit candidato y usar variables inyectadas por el gestor de secretos:

```bash
supabase link --project-ref "$STAGING_PROJECT_REF"
supabase migration list --linked
supabase db push --linked --dry-run
```

Adjuntar la lista y el dry-run. Revisar que el destino mostrado sea staging y que sólo aparezcan las migraciones esperadas. Con aprobación explícita:

```bash
supabase db push --linked
supabase migration list --linked
```

No usar `db reset --linked`. Si la historia remota difiere, detener el release; no reparar ni marcar migraciones aplicadas sin análisis.

- [ ] Ref staging verificado por dos personas o por responsable + evidencia automatizada.
- [ ] Dry-run coincide con el commit candidato.
- [ ] Push terminó sin error.
- [ ] `supabase migration list --linked` muestra local/remoto alineados.
- Responsable/fecha UTC:
- Evidencia:

La promoción a producción repite el mismo preflight con `PRODUCTION_PROJECT_REF`, pero sólo dentro del runbook de release, después de backup, freeze y go/no-go. No enlazar ambos proyectos en la misma sesión sin volver a verificar el ref visible.

## 3. Advisors y esquema expuesto

En Supabase Dashboard de staging, abrir Database > Security Advisor y Performance Advisor, volver a ejecutar ambos y exportar o capturar resultados sin datos sensibles.

- [ ] Cero errores del Security Advisor.
- [ ] Cero errores del Performance Advisor.
- [ ] Cada warning corregido o aceptado con riesgo, compensación, dueño y vencimiento.
- [ ] Repetición posterior a las correcciones adjunta.

Registro de excepción:

| Advisor/regla | Severidad | Decisión y motivo | Mitigación | Dueño | Vence | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

Verificación SQL de sólo lectura para las tablas expuestas por Data API:

```sql
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       count(p.polname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where c.relkind in ('r', 'p')
  and n.nspname in ('public', 'graphql_public')
group by n.nspname, c.relname, c.relrowsecurity
order by n.nspname, c.relname;
```

- [ ] Row Level Security habilitado en toda tabla expuesta.
- [ ] Cada tabla tiene políticas mínimas por rol/operación o una excepción explícita.
- [ ] Acceso `anon`, `authenticated` y `service_role` probado con identidades separadas.
- [ ] Publicaciones Realtime no exponen tablas sensibles sin políticas adecuadas.
- Responsable/fecha UTC:
- Evidencia de consulta y pruebas:

## 4. Auth y prevención de abuso

Verificar en staging y luego repetir en producción sin copiar valores a este archivo:

- [ ] Site URL usa HTTPS y el dominio exacto del entorno.
- [ ] Redirect allowlist contiene sólo callbacks necesarios; producción no usa comodines amplios ni localhost.
- [ ] Longitud mínima de contraseña de al menos 8, requisitos acordados y protección de contraseñas filtradas evaluada/habilitada según plan.
- [ ] Cambio de contraseña seguro/reauthentication habilitado cuando corresponda.
- [ ] SMTP propio configurado para producción; límites de email, OTP, login, refresh y verificación documentados y probados con 429 controlado.
- [ ] CAPTCHA para signup, login y recuperación: decisión registrada; si se omite, documentar riesgo y mitigación.
- [ ] JWT de corta duración (referencia inicial: 3600 s; no bajar de 5 min sin análisis) y rotación de refresh token habilitada.
- [ ] Timebox, inactividad y single-session evaluados; la configuración elegida tiene dueño.
- [ ] Procedimiento de revocación probado con usuario staging: sign-out global o eliminación/revocación administrativa, seguido de verificación tras vencer/refrescar el JWT.
- [ ] Alta pública de usuarios coincide con el modelo de negocio; deshabilitar signup anónimo si no se usa.

| Control Auth | Valor/decisión no secreta | Responsable | Fecha UTC | Evidencia |
| --- | --- | --- | --- | --- |
| Redirects | Pendiente | Pendiente | Pendiente | Pendiente |
| Contraseñas | Pendiente | Pendiente | Pendiente | Pendiente |
| Rate limits | Pendiente | Pendiente | Pendiente | Pendiente |
| CAPTCHA | Pendiente | Pendiente | Pendiente | Pendiente |
| JWT/sesiones | Pendiente | Pendiente | Pendiente | Pendiente |
| Revocación | Pendiente | Pendiente | Pendiente | Pendiente |

## 5. Secretos y conexiones

- [ ] Railway web y cron reciben secretos desde variables privadas, nunca desde Git.
- [ ] Navegador sólo recibe URL y anon/publishable key públicas.
- [ ] Runtime usa Shared Pooler/Session con TLS; migraciones usan una conexión separada.
- [ ] `DATABASE_POOL_MAX` está dentro del presupuesto de conexiones medido.
- [ ] Logs, artifacts y capturas fueron inspeccionados para evitar filtraciones.
- [ ] Acceso a Supabase/Railway/GitHub exige MFA y mínimo privilegio.

No registrar valores; registrar únicamente nombre, ubicación, dueño y última rotación:

| Secreto | Ubicación | Consumidor | Dueño | Última rotación | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Database | Pendiente | web/cron/migración | Pendiente | Pendiente | Pendiente |
| `service_role` | Pendiente | web/cron | Pendiente | Pendiente | Pendiente |
| Redis | Pendiente | web/cron | Pendiente | Pendiente | Pendiente |
| Cron | Pendiente | web/cron | Pendiente | Pendiente | Pendiente |
| Email | Pendiente | web/cron | Pendiente | Pendiente | Pendiente |

## 6. Gate

Supabase permanece **NO-GO** mientras falte una casilla o evidencia. Para aprobar:

- staging migrado y probado;
- advisors sin errores y warnings aceptados explícitamente;
- Row Level Security/Auth/secretos verificados;
- backup y restore completados según `backup-restore.md`;
- checkpoint de producción aprobado por release owner y database owner.

| Decisión | Release owner | Database owner | Fecha UTC | Evidencia |
| --- | --- | --- | --- | --- |
| NO-GO | Pendiente | Pendiente | Pendiente | Pendiente |

## Referencias oficiales

- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors)
- [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Password security](https://supabase.com/docs/guides/auth/password-security)
- [Rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [User sessions](https://supabase.com/docs/guides/auth/sessions)
