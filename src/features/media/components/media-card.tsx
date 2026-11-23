import Link from "next/link";
import { tmdbImage, tmdbSrcSet } from "@/lib/tmdb/images";
import type { MediaType } from "@/generated/prisma/client";

type MediaCardProps = {
  media: {
    displayKey?: string;
    displayOrder?: number;
    seasonLabel?: string | null;
    tmdbId: number;
    mediaType: MediaType;
    title: string;
    overview: string | null;
    posterPath: string | null;
    releaseDate: Date | null;
    voteAverage: number | null;
    isAnimated: boolean;
  };
  /** When set, links stay inside the collection so the back link returns there. */
  collectionSlug?: string;
  /** 1-based position in the collection's watch order. */
  position?: number;
};

export function MediaCard({ media, position, collectionSlug }: MediaCardProps) {
  const year = media.releaseDate?.getUTCFullYear();
  const path = `/media/${media.mediaType.toLowerCase()}/${media.tmdbId}`;
  const meta = [
    position ? `#${String(position).padStart(2, "0")}` : null,
    year ?? null,
    media.mediaType === "MOVIE" ? "Movie" : "TV show",
    media.isAnimated ? "Animated" : null,
  ].filter(Boolean);

  return (
    <Link
      href={collectionSlug ? `/collections/${collectionSlug}${path}` : path}
      className="group flex flex-col gap-3 outline-none"
    >
      <div className="aspect-2/3 overflow-hidden bg-muted ring-1 ring-foreground/10 transition-[box-shadow] group-hover:ring-foreground/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        {media.posterPath ? (
          <img
            src={tmdbImage(media.posterPath, "w500") ?? undefined}
            srcSet={tmdbSrcSet(media.posterPath, [342, 500, 780])}
            sizes="(min-width: 1280px) 230px, (min-width: 1024px) 25vw, 50vw"
            width={500}
            height={750}
            loading="lazy"
            decoding="async"
            alt={`${media.title} poster`}
            className="size-full object-contain"
          />
        ) : (
          <div className="flex size-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No poster image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="line-clamp-2 font-heading leading-snug font-medium transition-colors group-hover:text-primary">
          {media.title}
          {media.seasonLabel ? ` (${media.seasonLabel})` : ""}
        </h2>
        <p className="flex flex-wrap justify-between gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground tabular-nums">
          <span>{meta.join(" · ")}</span>
          {media.voteAverage != null ? (
            <span className="shrink-0">
              TMDB {media.voteAverage.toFixed(1)}
            </span>
          ) : null}
        </p>
        {media.overview ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {media.overview}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
