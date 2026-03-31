import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Ingresar | StudioFlow",
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
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const alert = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden flex-col justify-between rounded-3xl border bg-card p-10 text-card-foreground shadow-sm lg:flex">
            <div className="space-y-6">
              <span className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                StudioFlow
              </span>
              <div className="space-y-4">
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-balance">
                  Operación, cupos y reservas del estudio en un solo lugar.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  Staff y miembros comparten la misma plataforma con accesos
                  diferenciados para reservas, control de planes, seguimiento
                  de vencimientos y agenda del estudio.
                </p>
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background/70 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Reservas
                </dt>
                <dd className="mt-2 text-2xl font-semibold">Sin solapes</dd>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Planes
                </dt>
                <dd className="mt-2 text-2xl font-semibold">Con cupos</dd>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Alertas
                </dt>
                <dd className="mt-2 text-2xl font-semibold">En seguimiento</dd>
              </div>
            </dl>
          </section>

          <section className="flex items-center">
            <Card className="w-full border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl">Ingresar</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">
                  Accedé con las credenciales configuradas por el staff. Más
                  adelante vas a poder cambiar tu contraseña desde tu perfil.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {alert ? (
                  <Alert variant="destructive">
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </Alert>
                ) : null}

                <form action={loginAction} className="space-y-5">
                  <input type="hidden" name="next" value={params.next ?? ""} />

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nombre@studioflow.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Ingresá tu contraseña"
                      required
                    />
                  </div>

                  <Button className="w-full" type="submit">
                    Ingresar
                  </Button>
                </form>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Si no recordás tu acceso, hablá con el staff.</span>
                  <Button asChild variant="link" className="px-0">
                    <Link href="/">Volver</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
