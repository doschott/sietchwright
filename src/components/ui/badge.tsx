import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-elevated px-1.5 py-0.5 font-mono text-xs tracking-wide text-muted",
        className,
      )}
      {...props}
    />
  );
}
