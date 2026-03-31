import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  NotebookTabs,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/modules/auth/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
};

type SidebarNavProps = {
  role: AppRole;
};

const adminItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Miembros", icon: Users, hint: "Activos" },
  { href: "/admin/plans", label: "Planes", icon: Ticket },
  { href: "/admin/spaces", label: "Espacios", icon: MapPinned },
  { href: "/admin/bookings", label: "Reservas", icon: NotebookTabs },
  { href: "/admin/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/admin/renewals", label: "Renovaciones", icon: CreditCard },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

const memberItems: NavItem[] = [
  { href: "/member", label: "Inicio", icon: LayoutDashboard },
  { href: "/member/bookings", label: "Mis reservas", icon: CalendarDays },
  { href: "/member/plan", label: "Mi plan", icon: CreditCard },
  { href: "/member/profile", label: "Perfil", icon: Settings },
];

function getItemsForRole(role: AppRole) {
  return role === "member" ? memberItems : adminItems;
}

export function SidebarNav({ role }: SidebarNavProps) {
  const items = getItemsForRole(role);

  return (
    <nav aria-label="Principal" className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm text-muted-foreground transition",
              "hover:border-border hover:bg-card hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.label}</span>
            </span>
            {item.hint ? (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                {item.hint}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
