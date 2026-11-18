import Link from "next/link";
import { CollectionFavoriteButton } from "@/components/collection-favorite-button";
import { GenreBadges } from "@/components/genre-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { tmdbImage, tmdbSrcSet } from "@/lib/tmdb/images";
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
  imagePriority?: ImagePriority;
};

type ImagePriority = "high" | "eager" | "lazy";

const IMAGE_LOADING = {
  high: { loading: "eager", fetchPriority: "high" },
  eager: { loading: "eager" },
  lazy: { loading: "lazy", decoding: "async" },
} as const;

// Cards are laid out 70% (phone) / 3 / 4 per row inside max-w-7xl minus px-6.
const COVER_SIZES =
  "(min-width: 1280px) 293px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 70vw";

// First visible row loads eagerly; card 0 is the measured LCP element on /collections.
export const imagePriorityFor = (index: number): ImagePriority =>
  index === 0 ? "high" : index < 4 ? "eager" : "lazy";

export function CollectionCard({
  collection,
  imagePriority = "lazy",
}: CollectionCardProps) {
  const href = `/collections/${collection.slug}`;
  const isTmdbPath = !collection.coverImageUrl?.startsWith("http");
  const image = isTmdbPath
    ? tmdbImage(collection.coverImageUrl, "w780")
    : collection.coverImageUrl;

  return (
    <Card className="self-start">
      <Link href={href} prefetch className="group block">
        <div className="flex justify-center bg-muted">
          {image ? (
            <img
              src={image}
              {...IMAGE_LOADING[imagePriority]}
              {...(isTmdbPath && {
                srcSet: tmdbSrcSet(collection.coverImageUrl, [342, 500, 780]),
                sizes: COVER_SIZES,
                width: 500,
                height: 750,
              })}
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
        <Link href={href} prefetch className="group block">
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
          <Link href={href} prefetch className="min-w-0">
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
