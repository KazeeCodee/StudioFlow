"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  NotebookTabs,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import {
  canManageBookings,
  canManageMembers,
  canManagePlans,
  canManageSettings,
  canManageSpaces,
  canManageStaffUsers,
  canRenewPlans,
} from "@/lib/permissions/guards";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/modules/auth/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const adminGroups: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/admin/bookings", label: "Reservas", icon: NotebookTabs },
      { href: "/admin/calendar", label: "Agenda", icon: CalendarDays },
      { href: "/admin/renewals", label: "Renovaciones", icon: CreditCard },
    ],
  },
  {
    label: "Estudio",
    items: [
      { href: "/admin/spaces", label: "Espacios", icon: MapPinned },
      { href: "/admin/plans", label: "Planes", icon: Ticket },
      { href: "/admin/members", label: "Miembros", icon: Users },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/users", label: "Equipo", icon: ShieldCheck },
      { href: "/admin/settings", label: "Configuración", icon: Settings },
    ],
  },
];

const memberGroups: NavGroup[] = [
  {
    items: [
      { href: "/member", label: "Inicio", icon: LayoutDashboard, exact: true },
      { href: "/member/spaces", label: "Espacios", icon: MapPinned },
      { href: "/member/bookings", label: "Mis reservas", icon: CalendarDays },
      { href: "/member/plan", label: "Mi plan", icon: CreditCard },
      { href: "/member/profile", label: "Perfil", icon: Settings },
    ],
  },
];

function filterAdminItems(groups: NavGroup[], role: AppRole): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === "/admin/members") return canManageMembers(role);
        if (item.href === "/admin/plans") return canManagePlans(role);
        if (item.href === "/admin/spaces") return canManageSpaces(role);
        if (item.href === "/admin/bookings" || item.href === "/admin/calendar")
          return canManageBookings(role);
        if (item.href === "/admin/renewals") return canRenewPlans(role);
        if (item.href === "/admin/users") return canManageStaffUsers(role);
        if (item.href === "/admin/settings") return canManageSettings(role);
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

type NavItemLinkProps = {
  item: NavItem;
  pathname: string;
};

function NavItemLink({ item, pathname }: NavItemLinkProps) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href, item.exact);

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground nav-item-active-glow"
          : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
          active
            ? "bg-white/20 text-primary-foreground"
            : "bg-background/80 text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
        )}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

type SidebarNavProps = {
  role: AppRole;
};

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname() ?? "";
  const groups =
    role === "member"
      ? memberGroups
      : filterAdminItems(adminGroups, role);

  return (
    <nav aria-label="Principal" className="space-y-5">
      {groups.map((group, idx) => (
        <div key={idx} className="space-y-1">
          {group.label && (
            <p
              className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60"
              aria-hidden="true"
            >
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavItemLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ))}
    </nav>
  );
}
