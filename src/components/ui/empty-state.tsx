import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "gap-3 py-8",
        size === "md" && "gap-4 py-12",
        size === "lg" && "gap-5 py-16",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-muted text-muted-foreground",
            size === "sm" && "h-10 w-10",
            size === "md" && "h-12 w-12",
            size === "lg" && "h-16 w-16",
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <div className="space-y-1.5 max-w-sm">
        <p
          className={cn(
            "font-semibold text-foreground",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
          )}
        >
          {title}
        </p>

        {description && (
          <p
            className={cn(
              "text-muted-foreground leading-relaxed",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-sm",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
