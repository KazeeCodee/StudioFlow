export default function AdminHomePage() {
  return (
    <section className="rounded-3xl border bg-card p-8 shadow-sm">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
        Admin
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">
        Panel operativo en construcción
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        La base de autenticación ya está lista. En la siguiente iteración vamos
        a montar navegación, dashboard y módulos de gestión sobre esta vista.
      </p>
    </section>
  );
}
