"use client";

import { cn } from "cn";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { setCollectionFavorite } from "@/app/collections/actions";
import { Button } from "@/components/ui/button";

export function CollectionFavoriteButton({
  slug,
  name,
  isFavorite,
  className,
}: {
  slug: string;
  name: string;
  isFavorite: boolean;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleFavorite() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("favorite", String(!isFavorite));
      try {
        setError((await setCollectionFavorite(formData)).error);
      } catch {
        setError("Could not update favorites. Please try again.");
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
          isFavorite && "text-primary hover:text-primary",
        )}
        aria-label={
          isFavorite
            ? `Remove ${name} from favorites`
            : `Add ${name} to favorites`
        }
        aria-pressed={isFavorite}
        aria-busy={isPending}
        disabled={isPending}
        onClick={toggleFavorite}
      >
        <Heart
          aria-hidden="true"
          className={cn("size-5", isFavorite && "fill-current")}
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
