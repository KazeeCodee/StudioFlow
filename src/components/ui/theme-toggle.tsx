"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  variant?: "icon" | "full";
};

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = resolvedTheme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("shrink-0 rounded-lg", className)}
        aria-label="Cambiar tema"
        disabled
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          "transition-colors duration-150",
          className,
        )}
        aria-label={`Cambiar a modo ${isDark ? "claro" : "oscuro"}`}
      >
        {isDark ? (
          <Sun className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn("shrink-0 rounded-lg transition-all duration-150", className)}
      aria-label={`Cambiar a modo ${isDark ? "claro" : "oscuro"}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200" aria-hidden="true" />
      )}
    </Button>
  );
}
