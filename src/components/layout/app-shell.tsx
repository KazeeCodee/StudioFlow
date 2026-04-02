import type { ReactNode } from "react";
import { Film, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
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

function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            {isMember ? (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Film className="h-4 w-4" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              StudioFlow
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isMember ? "Portal del miembro" : "Centro operativo"}
            </p>
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav role={role} />
        </div>

        <Separator className="opacity-50" />

        {/* User footer */}
        <div className="flex items-center gap-2.5 p-3">
          <Avatar className="h-8 w-8 shrink-0 border border-border/60">
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground leading-none">
              {user.name}
            </p>
            <p className="mt-1 truncate text-[10px] text-muted-foreground leading-none">
              {user.email}
            </p>
          </div>
          <ThemeToggle className="shrink-0 text-muted-foreground" />
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} user={user} />

        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-7 lg:px-8">
            <PageHeader
              title={title}
              subtitle={subtitle}
              eyebrow={eyebrow}
              statusLabel={statusLabel}
            />

            <div className="animate-entrance">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
