import type { ReactNode } from "react";
import { Film, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { Separator } from "@/components/ui/separator";
import type { AppRole } from "@/modules/auth/types";

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  role: AppRole;
  user: {
    name: string;
    email: string;
  };
  eyebrow?: string;
  statusLabel?: string;
};

export function AppShell({
  children,
  title,
  subtitle,
  role,
  user,
  eyebrow,
  statusLabel,
}: AppShellProps) {
  const isMember = role === "member";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,_rgba(24,24,27,0.03),_transparent_26%),var(--background)] text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] gap-8 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[28px] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                {isMember ? <Sparkles className="h-5 w-5" /> : <Film className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  StudioFlow
                </p>
                <p className="text-sm font-semibold">
                  {isMember ? "Portal del miembro" : "Centro operativo"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <SidebarNav role={role} />
          </div>

          <Separator className="my-6" />

          <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {isMember ? "Tu acceso" : "Estado del estudio"}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {isMember
                ? "Entrá directo a tus reservas, tu plan y tus próximos controles desde este menú."
                : "Detectá renovaciones, agenda activa y miembros a seguir sin salir del panel."}
            </p>
          </div>
        </aside>

        <div className="rounded-[32px] border border-border/70 bg-background/90 p-5 shadow-sm backdrop-blur lg:p-7">
          <Topbar role={role} user={user} />

          <div className="mt-8 space-y-8">
            <PageHeader
              title={title}
              subtitle={subtitle}
              eyebrow={eyebrow}
              statusLabel={statusLabel}
            />

            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
