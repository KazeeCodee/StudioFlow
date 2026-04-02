import type { Metadata } from "next";
import Link from "next/link";
import { Film, CheckCircle2, CalendarDays, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Acceso para staff y miembros del estudio audiovisual.",
};

const errorMessages: Record<string, { title: string; description: string }> = {
  invalid_credentials: {
    title: "Credenciales inválidas",
    description: "Revisá el email y la contraseña e intentá nuevamente.",
  },
  profile_not_found: {
    title: "Acceso incompleto",
    description:
      "Tu usuario existe pero todavía no tiene un perfil operativo asignado.",
  },
  missing_credentials: {
    title: "Faltan datos",
    description: "Necesitamos email y contraseña para iniciar sesión.",
  },
  account_inactive: {
    title: "Cuenta no disponible",
    description:
      "Tu cuenta está inactiva o suspendida. Contactá a un administrador.",
  },
};

const statusMessages: Record<string, { title: string; description: string }> = {
  password_reset: {
    title: "Contraseña actualizada",
    description: "Ya podés ingresar con tu nueva contraseña.",
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    status?: string;
  }>;
};

const features = [
  {
    icon: CalendarDays,
    title: "Reservas sin solapes",
    desc: "Sistema de disponibilidad en tiempo real por espacio y horario.",
  },
  {
    icon: Users,
    title: "Membresías con cuotas",
    desc: "Cada plan asigna cuotas que se descuentan automáticamente al reservar.",
  },
  {
    icon: CheckCircle2,
    title: "Alertas operativas",
    desc: "Detectá renovaciones próximas y cupos críticos desde el dashboard.",
  },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const alert = params.error ? errorMessages[params.error] : null;
  const statusAlert = params.status ? statusMessages[params.status] : null;

  return (
    <main className="flex min-h-screen bg-background">
      {/* ── Brand panel (desktop) ─────────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[55%] xl:w-[60%]">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.14 0.025 280) 0%, oklch(0.10 0.015 280) 40%, oklch(0.08 0.008 260) 100%)",
          }}
        />

        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.17 280) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-0 h-[400px] w-[400px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, oklch(0.65 0.20 300) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <Film className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              StudioFlow
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Plataforma de gestión
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Operación, cupos y reservas del estudio en un solo lugar.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/60">
                Staff y miembros comparten la misma plataforma con accesos
                diferenciados para reservas, control de planes y seguimiento de
                vencimientos.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-4" role="list">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{f.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Footer stats */}
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: "Reservas", value: "Sin solapes" },
              { label: "Planes", value: "Con cuotas" },
              { label: "Alertas", value: "Automáticas" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-base font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Login panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
            <Film className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            StudioFlow
          </span>
        </div>

        <div className="w-full max-w-sm space-y-7">
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Bienvenido de vuelta
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Accedé con las credenciales configuradas por el staff.
            </p>
          </div>

          {/* Alerts */}
          {statusAlert && (
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-emerald-800 dark:text-emerald-300">
                {statusAlert.title}
              </AlertTitle>
              <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                {statusAlert.description}
              </AlertDescription>
            </Alert>
          )}

          {alert && (
            <Alert variant="destructive">
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form action={loginAction} className="space-y-5">
            <input type="hidden" name="next" value={params.next ?? ""} />

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@studioflow.com"
                required
                className="h-10 border-border/70 bg-background text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <Button
                  asChild
                  variant="link"
                  className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
                </Button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="h-10 border-border/70 bg-background text-sm"
              />
            </div>

            <Button
              type="submit"
              className="h-10 w-full rounded-xl text-sm font-semibold shadow-sm shadow-primary/20"
            >
              Ingresar al estudio
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            ¿Problemas para acceder?{" "}
            <Button asChild variant="link" className="h-auto px-0 text-xs">
              <Link href="/">Hablá con el staff</Link>
            </Button>
          </p>
        </div>
      </div>
    </main>
  );
}
