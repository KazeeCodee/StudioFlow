# Backup, restore y rotación

Estado inicial: **NO-GO**. Un archivo de backup no demuestra recuperación. Este gate sólo pasa cuando Database y Storage fueron restaurados y validados en un proyecto descartable.

## Objetivos y responsables

| Campo | Valor |
| --- | --- |
| Release/fecha UTC | Pendiente |
| Backup owner | Pendiente |
| Restore operator | Pendiente |
| Security reviewer | Pendiente |
| RPO acordado | Pendiente |
| RTO acordado | Pendiente |
| Retención aprobada | Pendiente |
| Ubicación off-site | Pendiente |
| Evidencia | Pendiente |

No almacenar exports, checksums sensibles, claves de cifrado ni manifiestos con nombres privados dentro del repositorio.

## 1. Política mínima

- Supabase Pro con backups diarios como piso. Evaluar PITR si el RPO acordado es menor a 24 horas.
- Export lógico cifrado y off-site independiente del proyecto Supabase.
- Export separado de objetos de Storage: el backup de Database sólo conserva metadatos de Storage, no los archivos.
- Al menos dos destinos/credenciales separados; la clave de descifrado no comparte ubicación con el backup.
- Retención sugerida para aprobar o reemplazar formalmente: diarios 14 días, semanales 8 semanas, mensuales 12 meses.
- Prueba trimestral y antes del primer go-live o de un cambio destructivo relevante.

| Copia | Frecuencia | Retención | Cifrado | Destino | Dueño | Última evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Supabase Database | Diaria | Según plan | Gestionado | Supabase | Pendiente | Pendiente |
| Export lógico Database | Diaria/semanal | Pendiente | Obligatorio | off-site | Pendiente | Pendiente |
| Objetos Storage | Diaria/semanal | Pendiente | Obligatorio | off-site | Pendiente | Pendiente |

## 2. Preparar una copia

Acción externa: antes de enlazar producción o leer sus datos, presentar alcance, destino, retención, responsables y confirmación. Usar una estación/runner endurecido y un directorio temporal fuera del repo.

Verificar primero en Dashboard Database > Backups:

- [ ] Plan y frecuencia activos.
- [ ] Último backup exitoso y timestamp dentro del RPO.
- [ ] Ventana PITR, si aplica.
- [ ] Alertas de backup tienen operador.
- Evidencia:

Después del checkpoint, generar los componentes recomendados por Supabase CLI. Las URLs/contraseñas entran por el gestor de secretos y no por argumentos persistidos en historial:

```bash
supabase link --project-ref "$PRODUCTION_PROJECT_REF"
supabase db dump --linked --role-only -f roles.sql
supabase db dump --linked -f schema.sql
supabase db dump --linked --data-only --use-copy -f data.sql
```

Registrar versiones de CLI/Postgres, tamaños y checksums. Cifrar inmediatamente con la herramienta corporativa aprobada, verificar que el cifrado pueda abrirse y borrar de forma segura los temporales de texto plano según la política del sistema. No subir `roles.sql`, `schema.sql` ni `data.sql` a Git.

- [ ] Roles, schema y data generados sin error.
- [ ] Artefactos cifrados antes de salir del runner.
- [ ] Checksums del archivo cifrado verificados en el destino off-site.
- [ ] Prueba de descifrado controlada aprobada.
- Responsable/fecha UTC:
- Evidencia:

## 3. Exportar Storage por separado

Inventariar buckets y objetos. Para el bucket actual:

```bash
supabase storage ls --linked --recursive ss:///uploads
supabase storage cp --linked --recursive ss:///uploads ./storage-export/uploads
```

Para grandes volúmenes, usar el endpoint S3 compatible con credenciales efímeras y una herramienta aprobada. Incluir en el manifiesto bucket, key, tamaño, hash cuando esté disponible, tipo y timestamp; nunca incluir credenciales o URLs firmadas.

Después de descargar:

- [ ] Cantidad/tamaño del inventario remoto coincide con el export.
- [ ] Muestra aleatoria abre y coincide en hash/tamaño.
- [ ] Export cifrado y enviado al destino off-site.
- [ ] Credencial S3 efímera revocada.
- Responsable/fecha UTC:
- Evidencia:

## 4. Ensayo en proyecto descartable

Crear un proyecto Supabase vacío y descartable, aislado de producción y sin integraciones de correo/webhooks reales. Esto es una acción externa con costo y datos: requiere checkpoint y autorización.

1. Registrar project ref descartable, región, versión Postgres, inicio UTC y punto de recuperación elegido.
2. Restaurar roles, schema y data siguiendo la guía oficial de Backup and Restore; habilitar antes las extensiones requeridas.
3. Restaurar objetos de Storage al bucket descartable desde el export cifrado, no desde producción.
4. Configurar secretos ficticios/rotados y email en modo log. Nunca conectar Railway producción al proyecto descartable.
5. Ejecutar migraciones pendientes sólo si el backup corresponde a un punto anterior al commit candidato.
6. Validar conteos y relaciones críticas, Auth, RLS, lectura de una muestra de Storage y flujos member/admin sin enviar mensajes reales.
7. Medir RPO desde el último registro recuperado y RTO desde el inicio hasta que todas las validaciones terminan.
8. Destruir el proyecto descartable sólo después de conservar evidencia aprobada y con una segunda confirmación explícita.

Validaciones mínimas de Database:

- [ ] Conteos por tabla reconciliados con el manifiesto de origen.
- [ ] Constraints, índices, funciones, triggers, RLS y grants presentes.
- [ ] Usuario de prueba puede autenticarse; sesiones de producción no fueron reutilizadas.
- [ ] Overlap de reservas y doble refund siguen protegidos.
- [ ] Advisors ejecutados sin errores nuevos.

Validaciones mínimas de Storage:

- [ ] Bucket y políticas restaurados.
- [ ] Cantidad/tamaño de objetos coincide.
- [ ] Muestra de imágenes descarga y renderiza.
- [ ] Upload/read/delete de un objeto sintético funciona y se limpia.

| Medición | Objetivo | Resultado | Inicio/fin UTC | Evidencia |
| --- | --- | --- | --- | --- |
| RPO | Pendiente | Pendiente | Pendiente | Pendiente |
| RTO | Pendiente | Pendiente | Pendiente | Pendiente |

Si RPO o RTO exceden el objetivo, el estado sigue **NO-GO** y se registra remediación con dueño/fecha.

## 5. Rotación posterior al ensayo

El ensayo manipula copias y credenciales privilegiadas. Tras aprobarlo, rotar en este orden para evitar cortes y validar cada consumidor antes de revocar el valor anterior:

1. Credenciales temporales/S3 del export.
2. Contraseña Database y URLs/poolers de Railway web y cron.
3. Clave `service_role`/secret key y consumidores server-side.
4. `REDIS_URL` o password del Redis compartido.
5. `CRON_SECRET` en web y cron.
6. Clave del proveedor de email.
7. Revocar valores anteriores y revisar logs de acceso fallido.

Cada rotación es externa e irreversible para clientes viejos: requiere checkpoint, plan de rollback y ventana. Nunca rotar todos los secretos de una vez.

| Secreto | Dueño | Consumidores actualizados | Valor anterior revocado UTC | Smoke | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Database | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| `service_role` | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Redis | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Cron | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| Email | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## 6. Gate de recuperación

- [ ] Backup diario vigente.
- [ ] Export lógico cifrado y off-site verificado.
- [ ] Storage exportado y reconciliado por separado.
- [ ] Restore completo en proyecto descartable demostrado.
- [ ] RPO/RTO dentro de objetivos.
- [ ] Secretos posteriores al ensayo rotados y valores viejos revocados.
- [ ] Evidencia aprobada por backup owner y security reviewer.

| Decisión | Backup owner | Security reviewer | Fecha UTC | Evidencia |
| --- | --- | --- | --- | --- |
| NO-GO | Pendiente | Pendiente | Pendiente | Pendiente |

## Referencias oficiales

- [Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Download Storage Objects](https://supabase.com/docs/guides/storage/management/download-objects)
