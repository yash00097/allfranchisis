"use client";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CollectionToggleButton({
  pressed,
  icon: Icon,
  label,
  onToggle,
  errorMessage,
  className,
}: {
  pressed: boolean;
  icon: LucideIcon;
  label: string;
  onToggle: (next: boolean) => Promise<{ error: string | null }>;
  errorMessage: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      try {
        setError((await onToggle(!pressed)).error);
      } catch {
        setError(errorMessage);
      }
    });
  }

  return (
    <div className={cn("flex shrink-0 flex-col items-end gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "size-11 bg-background dark:bg-background dark:hover:bg-muted",
          pressed && "text-primary hover:text-primary",
        )}
        aria-label={label}
        aria-pressed={pressed}
        aria-busy={isPending}
        disabled={isPending}
        onClick={toggle}
      >
        <Icon
          aria-hidden="true"
          className={cn("size-5", pressed && "fill-current")}
        />
      </Button>
      {error ? (
        <p
          role="alert"
          className="max-w-64 border bg-background p-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
