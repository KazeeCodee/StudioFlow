import { Bell } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { AppRole } from "@/modules/auth/types";

type TopbarProps = {
  role: AppRole;
  user: {
    name: string;
    email: string;
  };
  logoutFormAction?: (formData: FormData) => void | Promise<void>;
};

function getRoleLabel(role: AppRole) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Administrador";
    case "operator":
      return "Operador";
    case "member":
      return "Miembro";
    default:
      return "Staff";
  }
}

function getRoleBadgeClass(role: AppRole) {
  if (role === "member")
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300";
  if (role === "super_admin")
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300";
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300";
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  role,
  user,
  logoutFormAction = logoutAction,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md lg:px-8">
      {/* Search */}
      <div className="relative w-full max-w-sm">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15Z"
          />
        </svg>
        <Input
          aria-label="Buscar"
          className="h-9 border-border/60 bg-muted/50 pl-8 text-sm placeholder:text-muted-foreground/60 focus:bg-background"
          placeholder={
            role === "member"
              ? "Buscar reservas..."
              : "Buscar miembros, reservas, espacios..."
          }
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-lg"
          aria-label="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="mx-1 hidden h-5 w-px bg-border/70 sm:block" aria-hidden="true" />

        {/* User pill */}
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-2.5 py-1.5">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none text-foreground">
              {user.name}
            </p>
            <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
              {getRoleLabel(role)}
            </p>
          </div>
          <span
            className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline ${getRoleBadgeClass(role)}`}
          >
            {getRoleLabel(role)}
          </span>
        </div>

        <form action={logoutFormAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="hidden rounded-lg text-muted-foreground hover:text-foreground sm:flex"
            aria-label="Cerrar sesión"
          >
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
