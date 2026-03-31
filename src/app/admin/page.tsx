export default function AdminHomePage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Vista rápida
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Reservas hoy
            </p>
            <p className="mt-3 text-3xl font-semibold">18</p>
            <p className="mt-2 text-sm text-muted-foreground">
              4 espacios ocupados en simultáneo
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Renovaciones
            </p>
            <p className="mt-3 text-3xl font-semibold">6</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Miembros para seguimiento esta semana
            </p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Cupos críticos
            </p>
            <p className="mt-3 text-3xl font-semibold">3</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Planes con saldo por agotar
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Próximo paso
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Shell operativo listo para crecer
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          En la siguiente iteración montamos navegación real, dashboard con
          datos vivos y las primeras pantallas de miembros, espacios y agenda
          sobre esta misma base visual.
        </p>
      </section>
    </div>
  );
}
