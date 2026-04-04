import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, CalendarDays, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Acceso para gestionar reservas, membresias y operacion diaria.",
};

const errorMessages: Record<string, { title: string; description: string }> = {
  invalid_credentials: {
    title: "Credenciales invalidas",
    description: "Revisa el email y la contrasena e intenta nuevamente.",
  },
  profile_not_found: {
    title: "Acceso incompleto",
    description:
      "Tu usuario existe pero todavia no tiene un perfil operativo asignado.",
  },
  missing_credentials: {
    title: "Faltan datos",
    description: "Necesitamos email y contrasena para iniciar sesion.",
  },
  account_inactive: {
    title: "Cuenta no disponible",
    description:
      "Tu cuenta esta inactiva o suspendida. Contacta a un administrador.",
  },
};

const statusMessages: Record<string, { title: string; description: string }> = {
  password_reset: {
    title: "Contrasena actualizada",
    description: "Ya podes ingresar con tu nueva contrasena.",
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
    title: "Agenda centralizada",
    desc: "Visualiza disponibilidad por espacio y horario antes de confirmar cada reserva.",
  },
  {
    icon: Users,
    title: "Membresias bajo control",
    desc: "Administra planes, renovaciones y cuotas disponibles sin planillas paralelas.",
  },
  {
    icon: CheckCircle2,
    title: "Operacion mas clara",
    desc: "Detecta vencimientos, ocupacion y pendientes desde un solo panel.",
  },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const alert = params.error ? errorMessages[params.error] : null;
  const statusAlert = params.status ? statusMessages[params.status] : null;

  return (
    <main className="flex min-h-screen bg-background">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[55%] xl:w-[60%]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.14 0.025 280) 0%, oklch(0.10 0.015 280) 40%, oklch(0.08 0.008 260) 100%)",
          }}
        />

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

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3faff] ring-1 ring-white/15">
              <Image
                src="/branding/kazecode-logo.svg"
                alt="KazeCode"
                width={36}
                height={36}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              StudioFlow
            </span>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Software de gestion
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Gestioná reservas, membresías y operación diaria desde una sola
                plataforma.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/60">
                Centralizá agenda, cupos y seguimiento comercial en una
                experiencia clara para tu equipo y tus clientes.
              </p>
            </div>

            <ul className="space-y-4" role="list">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{feature.title}</p>
                      <p className="mt-0.5 text-xs text-white/50">{feature.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: "Reservas", value: "Ordenadas" },
              { label: "Membresias", value: "Activas" },
              { label: "Operacion", value: "Visible" },
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

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f3faff] ring-1 ring-primary/10">
            <Image
              src="/branding/kazecode-logo.svg"
              alt="KazeCode"
              width={34}
              height={34}
              className="h-7 w-auto object-contain"
              priority
            />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
            StudioFlow
          </span>
        </div>

        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Ingresá a tu cuenta
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Accedé con tu email y contraseña para administrar reservas,
              membresías y seguimiento diario.
            </p>
          </div>

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
                placeholder="nombre@tuestudio.com"
                required
                className="h-10 border-border/70 bg-background text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contrasena
                </Label>
                <Button
                  asChild
                  variant="link"
                  className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Link href="/forgot-password">Olvidé mi contraseña</Link>
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
              Ingresar a StudioFlow
            </Button>
          </form>

        </div>
      </div>
    </main>
  );
}
