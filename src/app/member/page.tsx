export default function MemberHomePage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Resumen personal
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cupos disponibles
            </p>
            <p className="mt-3 text-3xl font-semibold">12</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Equivalentes a horas base del estudio
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Próximo control
            </p>
            <p className="mt-3 text-3xl font-semibold">05 Abr</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Fecha visible para tu renovación manual
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Estado del portal
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Base lista para tus próximas reservas
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          En la siguiente etapa sumamos tu dashboard real, tu plan activo, tus
          reservas y el cambio de contraseña sobre este portal.
        </p>
      </section>
    </div>
  );
}
