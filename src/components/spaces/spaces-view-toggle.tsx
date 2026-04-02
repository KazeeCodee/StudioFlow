"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SpacesViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = searchParams.get("view") ?? "list";

  function setView(view: "list" | "grid") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div
      className="flex items-center rounded-xl border border-border/60 bg-muted/30 p-1 gap-0.5"
      role="group"
      aria-label="Vista de espacios"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("list")}
        className={`h-7 rounded-lg px-2.5 text-xs font-medium transition-all ${
          current === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={current === "list"}
        aria-label="Vista de lista"
      >
        <List className="h-3.5 w-3.5" />
        <span className="ml-1.5 hidden sm:inline">Lista</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setView("grid")}
        className={`h-7 rounded-lg px-2.5 text-xs font-medium transition-all ${
          current === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={current === "grid"}
        aria-label="Vista de tarjetas"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span className="ml-1.5 hidden sm:inline">Tarjetas</span>
      </Button>
    </div>
  );
}
