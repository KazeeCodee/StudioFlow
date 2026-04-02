import type { Metadata } from "next";
import { SpacesGrid } from "@/components/spaces/spaces-grid";
import { requireMemberContext } from "@/modules/auth/queries";
import { listPublicSpaces } from "@/modules/spaces/queries";

export const metadata: Metadata = {
  title: "Espacios disponibles",
  description: "Explorá todos los espacios disponibles para reservar.",
};

export default async function MemberSpacesPage() {
  await requireMemberContext();
  const spaces = await listPublicSpaces();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
          Estudio
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
          Espacios disponibles
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Explorá los espacios del estudio y reservá el que se adapte a tu proyecto.
        </p>
      </div>

      <SpacesGrid spaces={spaces} basePath="/member/spaces" />
    </div>
  );
}
