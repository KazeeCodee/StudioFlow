import Link from "next/link";
import { PlayCircle, ImageIcon, Users, Clock, ChevronRight } from "lucide-react";
import { SpaceStatusBadge } from "@/components/ui/status-badge";
import type { listSpaces } from "@/modules/spaces/queries";

type Space = Awaited<ReturnType<typeof listSpaces>>[number];

type SpacesGridProps = {
  spaces: Space[];
  basePath?: string;
};

function SpaceCard({ space, basePath = "/admin/spaces" }: { space: Space; basePath?: string }) {
  const hasImage = Boolean(space.imageUrl);
  const galleryCount = space.galleryUrls?.length ?? 0;
  const videoCount = space.videoLinks?.length ?? 0;

  return (
    <Link
      href={`${basePath}/${space.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/6 dark:hover:shadow-black/20"
    >
      {/* Image area */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={space.imageUrl!}
            alt={`Imagen de ${space.name}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        {/* Status badge on image */}
        <div className="absolute left-3 top-3">
          <SpaceStatusBadge
            status={space.status as "active" | "inactive" | "maintenance"}
          />
        </div>

        {/* Media indicators */}
        {(galleryCount > 0 || videoCount > 0) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {galleryCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" />
                {galleryCount}
              </span>
            )}
            {videoCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                <PlayCircle className="h-3 w-3 text-red-400" />
                {videoCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
              {space.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{space.slug}</p>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        {space.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {space.description}
          </p>
        )}

        {/* Stats row */}
        <div className="mt-auto flex items-center gap-3 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
              <span className="text-[10px] font-bold text-primary">
                {space.hourlyQuotaCost}
              </span>
            </div>
            cupos/h
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {space.minBookingHours}–{space.maxBookingHours}h
          </div>

          {space.capacity && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Users className="h-3.5 w-3.5" />
              {space.capacity}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SpacesGrid({ spaces, basePath = "/admin/spaces" }: SpacesGridProps) {
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 py-16 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
        <div>
          <p className="font-semibold text-foreground">No hay espacios activos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay espacios disponibles en este momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} basePath={basePath} />
      ))}
    </div>
  );
}
