import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nueva contrasena | StudioFlow",
  description: "Restablecer contrasena de acceso.",
};

const errorMessages: Record<string, string> = {
  session_missing: "La sesion de recuperacion no esta disponible o ya vencio.",
  update_failed: "No se pudo actualizar la contrasena. Proba con un nuevo enlace.",
  auth_callback_failed:
    "No pudimos validar el enlace de recuperacion. Pedi uno nuevo desde el login.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
        <Card className="w-full border-border/70 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">Definir nueva contrasena</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Elegi una contrasena nueva para volver a entrar a StudioFlow.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResetPasswordForm initialError={error} />

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
