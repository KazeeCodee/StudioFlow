import { redirect } from "next/navigation";
import { RenewalHistoryTable } from "@/components/renewals/renewal-history-table";
import { RenewalsWorkbench } from "@/components/renewals/renewals-workbench";
import { canRenewPlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { listRenewalHistory, listRenewalQueue } from "@/modules/renewals/queries";
import { renewalFiltersSchema } from "@/modules/renewals/schema";

type RenewalsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RenewalsPage({ searchParams }: RenewalsPageProps) {
  const { profile } = await requireStaffContext();

  if (!canRenewPlans(profile.role)) {
    redirect("/admin");
  }

  const raw = await searchParams;
  const parsed = renewalFiltersSchema.safeParse({
    view: firstValue(raw.view),
    q: firstValue(raw.q),
    page: firstValue(raw.page),
  });
  const filters = parsed.success
    ? parsed.data
    : renewalFiltersSchema.parse({ view: "pending", q: "", page: 1 });

  if (filters.view === "history") {
    const history = await listRenewalHistory({
      q: filters.q,
      page: filters.page,
      pageSize: 25,
    });

    return (
      <div className="space-y-5">
        <RenewalsHeader />
        <RenewalHistoryTable result={history} q={filters.q} />
      </div>
    );
  }

  const queue = await listRenewalQueue({
    view: filters.view,
    q: filters.q,
    page: filters.page,
    pageSize: 25,
  });

  return (
    <div className="space-y-5">
      <RenewalsHeader pendingCount={queue.counts.pending} />
      <RenewalsWorkbench result={queue} view={filters.view} q={filters.q} />
    </div>
  );
}

function RenewalsHeader({ pendingCount }: { pendingCount?: number }) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Renovaciones</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Verificá pagos, renová planes y consultá cada cambio desde una sola cola operativa.
        </p>
      </div>
      {pendingCount !== undefined ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{pendingCount}</span>{" "}
          requieren atención
        </p>
      ) : null}
    </header>
  );
}
