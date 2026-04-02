import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  ImageIcon,
  PlayCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicSpaceDetail } from "@/modules/spaces/queries";
import { SpaceStatusBadge } from "@/components/ui/status-badge";
import { extractYoutubeId } from "@/modules/spaces/schema";

type SpaceDetailPageProps = {
  params: Promise<{ spaceId: string }>;
};

function YoutubeIframe({ url }: { url: string }) {
  const videoId = extractYoutubeId(url);
  if (!videoId) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/40 shadow-sm">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
        title="Recorrido del espacio"
      />
    </div>
  );
}

export async function generateMetadata({ params }: SpaceDetailPageProps) {
  const { spaceId } = await params;
  const space = await getPublicSpaceDetail(spaceId).catch(() => null);

  if (!space) {
    return {
      title: "Espacio no encontrado",
    };
  }

  return {
    title: `${space.name} | StudioFlow`,
    description: space.description || `Detalle del espacio ${space.name}`,
  };
}

export default async function MemberSpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { spaceId } = await params;
  const space = await getPublicSpaceDetail(spaceId).catch(() => null);

  if (!space) {
    redirect("/member/spaces");
  }

  const allImages = [
    ...(space.imageUrl ? [space.imageUrl] : []),
    ...(space.galleryUrls ?? []),
  ];

  const hasVideos = space.videoLinks && space.videoLinks.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* ── Context & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2.5 text-muted-foreground hover:text-foreground">
          <Link href="/member/spaces">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a los espacios
          </Link>
        </Button>

        <Button asChild className="rounded-xl shadow-md transition-transform hover:-translate-y-0.5" size="lg">
          <Link href={`/member/bookings/new?spaceId=${space.id}`}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Reservar este espacio
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* ── Header ── */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{space.name}</h1>
              <SpaceStatusBadge
                status={space.status as "active" | "inactive" | "maintenance"}
              />
            </div>
            {space.description && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {space.description}
              </p>
            )}
          </div>

          {/* ── Main Gallery ── */}
          {allImages.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-muted/40 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={allImages[0]}
                  alt={`Vista principal de ${space.name}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                  {allImages.slice(1).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/40 transition-opacity hover:opacity-80 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Vista adicional ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">Sin imágenes cargadas</p>
            </div>
          )}

          {/* ── Videos ── */}
          {hasVideos && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold text-foreground">Videos y recorridos</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {space.videoLinks.map((url, idx) => (
                  <YoutubeIframe key={idx} url={url} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar Info ── */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-foreground">Detalles operativos</h3>
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="font-bold">{space.hourlyQuotaCost}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Costo por hora</p>
                  <p className="text-xs text-muted-foreground">cupos a descontar de tu plan</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Clock className="h-5 w-5 opacity-70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Tiempo de uso</p>
                  <p className="text-xs text-muted-foreground">
                    mínimo {space.minBookingHours}h / máximo {space.maxBookingHours}h
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Users className="h-5 w-5 opacity-70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Capacidad recomendada</p>
                  <p className="text-xs text-muted-foreground">
                    {space.capacity ? `hasta ${space.capacity} personas` : "Sin límite"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón secundario por si scrollean mucho */}
          <Button asChild className="w-full rounded-xl shadow-md transition-transform hover:-translate-y-0.5 text-base h-12">
            <Link href={`/member/bookings/new?spaceId=${space.id}`}>
              Reservar este espacio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
