import { redirect } from "next/navigation";
import { AdminSpaceDetail } from "@/components/spaces/admin-space-detail";
import { canManageSpaces } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { getSpaceDetail } from "@/modules/spaces/queries";

type SpaceDetailPageProps = {
  params: Promise<{
    spaceId: string;
  }>;
};

export default async function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { profile } = await requireStaffContext();

  if (!canManageSpaces(profile.role)) {
    redirect("/admin");
  }

  const { spaceId } = await params;
  const space = await getSpaceDetail(spaceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Espacios</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{space.name}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {space.description ?? "Todavía no hay una descripción operativa para este espacio."}
        </p>
      </div>

      <AdminSpaceDetail space={space} />
    </div>
  );
}
