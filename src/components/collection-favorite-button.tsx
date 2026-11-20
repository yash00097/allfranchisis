"use client";

import { Heart } from "lucide-react";
import { setCollectionFavorite } from "@/app/collections/actions";
import { CollectionToggleButton } from "@/components/collection-toggle-button";

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
  return (
    <CollectionToggleButton
      pressed={isFavorite}
      icon={Heart}
      label={
        isFavorite
          ? `Remove ${name} from favorites`
          : `Add ${name} to favorites`
      }
      errorMessage="Could not update favorites. Please try again."
      className={className}
      onToggle={(next) => {
        const formData = new FormData();
        formData.set("slug", slug);
        formData.set("favorite", String(next));
        return setCollectionFavorite(formData);
      }}
    />
  );
}
