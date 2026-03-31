import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppRole } from "@/modules/auth/types";

type TopbarProps = {
  role: AppRole;
  user: {
    name: string;
    email: string;
  };
};

function getRoleLabel(role: AppRole) {
  return role === "member" ? "Miembro" : "Staff";
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Topbar({ role, user }: TopbarProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar"
            className="border-border/70 bg-background pl-9"
            placeholder={
              role === "member"
                ? "Buscar reservas o reglas"
                : "Buscar miembros, reservas o espacios"
            }
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Ver alertas</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-end">
        <Badge
          variant="outline"
          className="rounded-full border-amber-300/60 bg-amber-100/60 px-3 py-1 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {role === "member" ? "Portal activo" : "Monitoreo operativo"}
        </Badge>

        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-2">
          <Avatar className="h-10 w-10 border border-border/70">
            <AvatarFallback className="bg-muted font-medium text-foreground">
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(role)} · {user.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
