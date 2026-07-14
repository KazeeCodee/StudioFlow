"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RenewalsError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <div className="rounded-xl border bg-card px-6 py-12 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-semibold">No pudimos cargar las renovaciones</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Tus datos no fueron modificados. Reintentá la consulta para continuar.</p>
      <Button type="button" variant="outline" className="mt-5" onClick={() => unstable_retry()}>Reintentar</Button>
    </div>
  );
}
