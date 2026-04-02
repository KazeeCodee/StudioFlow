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

El repo incluye configuracion para Railway/Nixpacks:

- `nixpacks.toml` fuerza `npm ci`, `npm run build` y `npm run start`
- `.nvmrc` y `package.json` fijan Node 20

Variables minimas a cargar en Railway:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `APP_URL`
- `CRON_SECRET`

Variables recomendadas:

- `DATABASE_POOL_MAX=1`
- `EMAIL_TRANSPORT_MODE`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `USE_NEXT_RSPACK=false`

## Checks de calidad

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

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
