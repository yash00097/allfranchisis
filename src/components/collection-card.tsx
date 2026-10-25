import Link from "next/link";
import { CollectionFavoriteButton } from "@/components/collection-favorite-button";
import { GenreBadges } from "@/components/genre-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { tmdbImage } from "@/lib/tmdb/images";
import { WATCH_STATUS_LABELS } from "@/lib/watch-status/types";

type CollectionCardProps = {
  collection: {
    slug: string;
    name: string;
    description: string;
    genres: string[];
    coverImageUrl: string | null;
    _count: { media: number };
    status?: "WATCHING" | "WATCHED" | null;
    isFavorite?: boolean;
  };
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const href = `/collections/${collection.slug}`;
  const image = collection.coverImageUrl?.startsWith("http")
    ? collection.coverImageUrl
    : tmdbImage(collection.coverImageUrl, "w780");

  return (
    <Card className="self-start">
      <Link href={href} className="group block">
        <div className="flex justify-center bg-muted">
          {image ? (
            <img
              src={image}
              alt=""
              className="block h-auto w-full object-contain"
            />
          ) : (
            <div className="flex min-h-32 w-full items-center justify-center text-sm text-muted-foreground">
              No cover image
            </div>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-col gap-2 p-4">
        <Link href={href} className="group block">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">
              {collection.name}
            </h2>
            {collection.status ? (
              <Badge variant="secondary" className="shrink-0">
                {WATCH_STATUS_LABELS[collection.status]}
              </Badge>
            ) : null}
            <span className="shrink-0 text-xs text-muted-foreground">
              {collection._count.media} items
            </span>
          </div>
        </Link>
        <div className="flex items-start justify-between gap-3">
          <Link href={href} className="min-w-0">
            <GenreBadges genres={collection.genres} />
          </Link>
          {collection.isFavorite !== undefined ? (
            <CollectionFavoriteButton
              slug={collection.slug}
              name={collection.name}
              isFavorite={collection.isFavorite}
              className="items-end"
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
