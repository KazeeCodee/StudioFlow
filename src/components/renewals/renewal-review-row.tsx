"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatStudioDate, getStudioDateTimeParts } from "@/lib/datetime";
import { buildRenewalPreview } from "@/modules/renewals/calendar";
import {
  initialRenewalActionState,
  renewMemberPlanAction,
} from "@/modules/renewals/actions";
import type { RenewalQueueItem } from "@/modules/renewals/queries";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

function toDateInputValue(date: Date) {
  const { year, month, day } = getStudioDateTimeParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function RenewalReviewRow({
  item,
  now,
  onClose,
  onCompleted,
}: {
  item: RenewalQueueItem;
  now: Date;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    renewMemberPlanAction,
    initialRenewalActionState,
  );
  const [verified, setVerified] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const panelRef = useRef<HTMLElement>(null);
  const preview = buildRenewalPreview({
    now,
    currentEndDate: item.endsAt,
    durationType: item.planDurationType,
    durationValue: item.planDurationValue,
    quotaAmount: item.planQuotaAmount,
  });
  const needsReference = paymentMethod === "bank_transfer" || paymentMethod === "card";

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <section
      ref={panelRef}
      role="region"
      aria-label={`Verificar pago de ${item.memberName}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="outline-none"
    >
      <div className="border-t bg-muted/25 px-4 py-5 md:px-6">
        {state.status === "success" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="font-medium">{state.message}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nuevo vencimiento {state.newEndDate ? formatStudioDate(new Date(state.newEndDate)) : "confirmado"} ·{" "}
                  <span className="tabular-nums">{state.quotaRemaining} cupos disponibles</span>
                </p>
              </div>
            </div>
            <Button type="button" onClick={onCompleted ?? onClose}>
              Revisar siguiente
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="memberPlanId" value={item.memberPlanId} />
            <input type="hidden" name="expectedNextPaymentDueAt" value={item.nextPaymentDueAt.toISOString()} />
            <input type="hidden" name="currency" value="ARS" />

            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Verificar pago · {item.memberName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.planName} · esperado {money.format(Number(item.planPrice ?? 0))}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4" aria-hidden="true" />
                La operación quedará auditada
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor={`amount-${item.memberPlanId}`}>Importe recibido</Label>
                <Input
                  id={`amount-${item.memberPlanId}`}
                  name="amountReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.planPrice ?? "0"}
                  disabled={pending}
                  aria-invalid={Boolean(state.fieldErrors?.amountReceived)}
                />
                {state.fieldErrors?.amountReceived?.map((error) => <p key={error} className="text-xs text-destructive">{error}</p>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`method-${item.memberPlanId}`}>Método</Label>
                <select
                  id={`method-${item.memberPlanId}`}
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  disabled={pending}
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="bank_transfer">Transferencia</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`paid-${item.memberPlanId}`}>Fecha del pago</Label>
                <Input id={`paid-${item.memberPlanId}`} name="paidAt" type="date" defaultValue={toDateInputValue(now)} disabled={pending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`reference-${item.memberPlanId}`}>
                  Referencia {needsReference ? "" : "(opcional)"}
                </Label>
                <Input
                  id={`reference-${item.memberPlanId}`}
                  name="externalReference"
                  required={needsReference}
                  placeholder={needsReference ? "Ej. TRX-8821" : "Referencia externa"}
                  disabled={pending}
                  aria-invalid={Boolean(state.fieldErrors?.externalReference)}
                />
                {state.fieldErrors?.externalReference?.map((error) => <p key={error} className="text-xs text-destructive">{error}</p>)}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
              <div className="space-y-2">
                <Label htmlFor={`notes-${item.memberPlanId}`}>Nota interna (opcional)</Label>
                <Textarea id={`notes-${item.memberPlanId}`} name="notes" placeholder="Contexto útil para una revisión posterior" disabled={pending} />
              </div>
              <div className="rounded-lg border bg-background p-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Antes</p>
                    <p className="mt-1 text-sm font-medium tabular-nums">{formatStudioDate(item.endsAt)}</p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">{item.quotaRemaining} restantes · {item.quotaUsed} usados</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Después</p>
                    <p className="mt-1 text-sm font-medium tabular-nums">{formatStudioDate(preview.newEndDate)}</p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">{preview.quotaRemaining} disponibles · 0 usados</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="paymentVerified"
                  value="true"
                  checked={verified}
                  onChange={(event) => setVerified(event.target.checked)}
                  disabled={pending}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>Confirmo que verifiqué el pago y los datos ingresados.</span>
              </label>
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button>
                <Button type="submit" disabled={!verified || pending}>
                  {pending ? "Renovando…" : "Confirmar pago y renovar"}
                </Button>
              </div>
            </div>

            {state.status === "error" ? (
              <div role="alert" aria-live="polite" className="flex gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {state.message}
              </div>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
