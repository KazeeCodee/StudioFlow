"use client";

import { useRef, useState, type FormEvent } from "react";
import { CircleAlert } from "lucide-react";
import { AlertDialog } from "radix-ui";
import { createMemberAction } from "@/modules/members/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { listActivePlanOptions } from "@/modules/plans/queries";

type PlanOption = Awaited<ReturnType<typeof listActivePlanOptions>>[number];

type MemberFormProps = {
  planOptions: PlanOption[];
};

export function MemberForm({ planOptions }: MemberFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const allowWithoutPlanRef = useRef(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const planId = new FormData(event.currentTarget).get("planId");

    if (!planId && !allowWithoutPlanRef.current) {
      event.preventDefault();
      setIsConfirmationOpen(true);
      return;
    }

    allowWithoutPlanRef.current = false;
  }

  function handleConfirmWithoutPlan() {
    allowWithoutPlanRef.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Crear miembro</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            action={createMemberAction}
            className="grid gap-5 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Nombre y apellido</Label>
            <Input id="fullName" name="fullName" placeholder="Ana Pérez" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="ana@correo.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" placeholder="+54 11 ..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña inicial</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue="active"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="planId">Plan asignado</Label>
            <select
              id="planId"
              name="planId"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="">
                Sin plan por ahora
              </option>
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {plan.quotaAmount} cupos
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Podés asignarlo ahora o más adelante desde la ficha del miembro.
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea id="notes" name="notes" placeholder="Observaciones del staff..." />
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Crear miembro</Button>
          </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog.Root open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 rounded-3xl border border-border/70 bg-popover p-6 text-popover-foreground shadow-xl shadow-foreground/10 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CircleAlert aria-hidden="true" className="size-5" />
              </div>
              <div className="space-y-2">
                <AlertDialog.Title className="font-heading text-lg font-semibold tracking-tight">
                  Crear miembro sin plan
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">
                  Este miembro quedará sin cupos ni vencimiento hasta que le asignes un plan. Podrás
                  hacerlo más adelante desde su ficha.
                </AlertDialog.Description>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  Volver al formulario
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button type="button" onClick={handleConfirmWithoutPlan}>
                  Crear sin plan
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
