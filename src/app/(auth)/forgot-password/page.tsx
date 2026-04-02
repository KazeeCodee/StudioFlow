import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Recuperar acceso | StudioFlow",
  description: "Recuperación de contraseña para staff y miembros.",
};

const statusMessages: Record<string, { title: string; description: string }> = {
  sent: {
    title: "Revisá tu email",
    description:
      "Si la cuenta existe, te enviamos un enlace para restablecer la contraseña.",
  },
};

const errorMessages: Record<string, { title: string; description: string }> = {
  request_failed: {
    title: "No pudimos enviar el correo",
    description: "Probá de nuevo en unos minutos.",
  },
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    email?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const statusAlert = params.status ? statusMessages[params.status] : null;
  const errorAlert = params.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
        <Card className="w-full border-border/70 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Ingresá tu email y te vamos a enviar un enlace para definir una nueva contraseña.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {statusAlert ? (
              <Alert>
                <AlertTitle>{statusAlert.title}</AlertTitle>
                <AlertDescription>{statusAlert.description}</AlertDescription>
              </Alert>
            ) : null}

            {errorAlert ? (
              <Alert variant="destructive">
                <AlertTitle>{errorAlert.title}</AlertTitle>
                <AlertDescription>{errorAlert.description}</AlertDescription>
              </Alert>
            ) : null}

            <form action={forgotPasswordAction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@studioflow.com"
                  defaultValue={params.email ?? ""}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Enviar enlace
              </Button>
            </form>

            <div className="flex justify-end text-sm">
              <Button asChild variant="link" className="px-0">
                <Link href="/login">Volver al login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
