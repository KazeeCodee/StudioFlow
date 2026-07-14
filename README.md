# StudioFlow

Plataforma operativa para estudios audiovisuales con dos superficies dentro de la misma app:

- panel administrativo para staff
- portal de autogestión para miembros

El MVP cubre reservas sin solapamientos, control de cupos, planes, renovaciones manuales, alertas operativas y gestión básica de espacios.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Auth + Postgres + Storage
- Drizzle ORM
- Tailwind CSS
- Vitest + Testing Library
- Playwright

## Requisitos

- Node.js 20+
- npm 10+
- un proyecto de Supabase
- base Postgres accesible desde `DATABASE_URL`

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```bash
cp .env.example .env.local
```

Variables mínimas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Variables operativas:

- `APP_URL`
- `CSP_REPORT_ONLY` (`true` en staging durante el ajuste de la política; `false` en producción)
- `CRON_SECRET`
- `DATABASE_POOL_MAX`
- `EMAIL_TRANSPORT_MODE`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `USE_NEXT_RSPACK`

Recomendaciones:

- en desarrollo/E2E dejÃ¡ `DATABASE_POOL_MAX=1` para evitar agotar conexiones en bases chicas
- `USE_NEXT_RSPACK=false` mantiene el camino estable por defecto; activalo solo si querÃ©s probar el bundler experimental

## Instalación

```bash
npm install
```

## Base de datos y storage

Este repo ya incluye migraciones en [`supabase/migrations`](/E:/Proyectos/GitHub/StudioFlow/supabase/migrations).

Aplicalas en orden sobre tu proyecto de Supabase:

1. `0000_polite_supreme_intelligence.sql`
2. `0001_faulty_dakota_north.sql`
3. `0002_production_security_hardening.sql`
4. `0003_space_images_storage_bucket.sql`
5. `0004_spaces_gallery_and_videos.sql`

Notas:

- `0002` habilita RLS y políticas mínimas para staff/member.
- `0003` crea el bucket público `uploads` para imágenes.
- `0004` agrega galería de imágenes y videos de YouTube a `spaces`.
- El bucket `uploads` acepta solamente JPG/JPEG, PNG, GIF y WebP de hasta 5 MB.
- Antes de endurecer un bucket existente, listá y exportá cualquier SVG. Las copias de la base de datos no restauran objetos eliminados de Storage.

Si usás Supabase CLI o un pipeline propio, podés ejecutar esas migraciones con tu flujo habitual. Si no, podés correrlas desde el SQL Editor de Supabase.

## Bootstrap del primer admin

La app ya permite crear usuarios internos desde `/admin/users`, pero para eso primero necesitás un usuario staff inicial.

Ejecutalo directamente con Node:

```bash
node scripts/bootstrap-admin.mjs --email admin@studioflow.dev --password Admin1234! --name "Admin Inicial"
```

Opcionales:

- `--role super_admin|admin|operator`
- `--phone "+54 11 ..."`

El script:

- crea o actualiza el usuario en Supabase Auth
- asegura el `profile` interno en la tabla `profiles`
- deja el estado en `active`

Después podés entrar por [http://localhost:3000/login](http://localhost:3000/login).

## Desarrollo

```bash
npm run dev
```

## Deploy en Railway

El repo incluye configuracion como codigo para dos servicios Railway:

- `railway.toml`: servicio web persistente, healthcheck `/api/health/ready` y timeout de 300 segundos
- `railway.cron.toml`: cron diario `0 12 * * *` UTC que ejecuta `scripts/run-notifications-cron.mjs` y termina
- `nixpacks.toml`: compatibilidad con deployments existentes; los servicios nuevos usan Railpack
- `.nvmrc` y `package.json` fijan Node 20
- el build standalone copia `public` y `.next/static` dentro de `.next/standalone`

En Railway, el servicio web usa el archivo por defecto `/railway.toml`. El servicio cron debe apuntar su Config File Path a `/railway.cron.toml`. Mantené una sola replica web para el primer release y no asignes un dominio publico al servicio cron.

Variables minimas a cargar en Railway:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `APP_URL`
- `CRON_SECRET`

Variables recomendadas:

- `DATABASE_POOL_MAX=5` como punto de partida; validalo contra el limite de conexiones del proyecto Supabase
- `EMAIL_TRANSPORT_MODE`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `USE_NEXT_RSPACK=false`

Para el runtime web, copiá desde Supabase el connection string de **Shared Pooler / Session mode** (puerto `5432`) y exigí SSL. La forma esperada es:

```text
postgresql://postgres.<project-ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

Usá una conexion directa separada para migraciones. Nunca guardes ninguno de esos valores en Git.

Checklist del dashboard antes de verificar staging:

- web: una replica, Config File Path `/railway.toml`, variables completas y dominio HTTPS
- cron: Config File Path `/railway.cron.toml`, mismo `APP_URL`/`CRON_SECRET` que el web y sin dominio publico
- confirmar que una ejecucion manual del cron termina y deja un resumen JSON
- conservar `vercel.json` hasta demostrar paridad en Railway staging; recien entonces eliminarlo

## Checks de calidad

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

### E2E aislado contra staging

Los E2E con mutaciones no leen `.env.local` y nunca deben apuntar a produccion:

```bash
cp .env.e2e.example .env.e2e.local
```

Completá las credenciales del proyecto **staging**, indicá el project ref real de produccion solamente como guarda y cambiá `E2E_ALLOW_MUTATIONS=true` justo antes de una corrida intencional. El loader exige que la URL de Supabase y `DATABASE_URL` pertenezcan al ref staging esperado y aborta si detecta el ref de produccion.

```bash
npm run test:e2e
```

Cada spec limpia sus usuarios/registros en `finally` y cierra su cliente SQL. Si falta `.env.e2e.local`, el opt-in o una referencia no coincide, Playwright aborta antes de iniciar el servidor.

### CI y gates de release

El workflow `CI` ejecuta con Node 20: instalacion reproducible, auditoria de dependencias de produccion, lint, unitarios, integracion sobre Supabase local, cobertura y build. El baseline medido el 2026-07-14 es:

| Metrica | Baseline / umbral |
| --- | ---: |
| Statements | 56.61% |
| Branches | 51.64% |
| Functions | 61.41% |
| Lines | 56.48% |

Los umbrales no deben reducirse. `Staging E2E` usa el GitHub Environment `staging`, secretos exclusivos de staging y una concurrency group unica para impedir dos suites mutando el mismo proyecto a la vez.

Configura un ruleset para `master` con pull request obligatorio, al menos una aprobacion, conversaciones resueltas, branch actualizado, bloqueo de force-push/delete y estos status checks requeridos:

- `CI / quality`
- `CI / database`
- `Staging E2E / e2e`

No permitas pushes directos. Railway production debe mantener autodeploy deshabilitado y promocion manual hasta registrar dos releases exitosos con todos los gates.

## Notificaciones

Por defecto el sistema no envía correos reales:

- `EMAIL_TRANSPORT_MODE=log` registra los envíos en consola y en la tabla `notification_deliveries`

Para usar Resend:

- `EMAIL_TRANSPORT_MODE=resend`
- `EMAIL_FROM=StudioFlow <no-reply@tu-dominio.com>`
- `RESEND_API_KEY=...`

El cron está expuesto en `GET /api/cron/notifications` y requiere:

- header `Authorization: Bearer <CRON_SECRET>`

## Flujos principales cubiertos

- alta de miembro desde admin
- reserva de espacio desde portal miembro
- cancelación con reintegro según política
- renovación manual desde admin
- gestión de planes, espacios y usuarios internos

## Estado actual de release

Antes de considerar una primera versión lista, verificá como mínimo:

- `npm run lint`
- `npm test`
- `npm run test:e2e`
- `npm run build`

Si vas a desplegarla, además confirmá:

- migraciones aplicadas
- bucket `uploads` creado
- primer admin bootstrappeado
- `APP_URL` y `CRON_SECRET` configurados
- proveedor de correo listo si querés notificaciones reales
