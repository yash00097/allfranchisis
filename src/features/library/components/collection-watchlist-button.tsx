"use client";

import { Bookmark } from "lucide-react";
import { setCollectionWatchlist } from "@/features/library/actions";
import { CollectionToggleButton } from "@/features/library/components/collection-toggle-button";

export function CollectionWatchlistButton({
  slug,
  name,
  isWatchlisted,
  className,
}: {
  slug: string;
  name: string;
  isWatchlisted: boolean;
  className?: string;
}) {
  return (
    <CollectionToggleButton
      pressed={isWatchlisted}
      icon={Bookmark}
      label={
        isWatchlisted
          ? `Remove ${name} from watchlist`
          : `Add ${name} to watchlist`
      }
      errorMessage="Could not update watchlist. Please try again."
      className={className}
      onToggle={(next) => {
        const formData = new FormData();
        formData.set("slug", slug);
        formData.set("watchlist", String(next));
        return setCollectionWatchlist(formData);
      }}
    />
  );
}
