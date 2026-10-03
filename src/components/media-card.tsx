import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { tmdbImage } from "@/lib/tmdb/images";
import type { MediaType } from "@/generated/prisma/client";

type MediaCardProps = {
  media: {
    tmdbId: number;
    mediaType: MediaType;
    title: string;
    overview: string | null;
    posterPath: string | null;
    releaseDate: Date | null;
    voteAverage: number | null;
    isAnimated: boolean;
  };
};

export function MediaCard({ media }: MediaCardProps) {
  const year = media.releaseDate?.getUTCFullYear();
  const type = media.mediaType === "MOVIE" ? "Movie" : "TV show";

  return (
    <Link
      href={`/media/${media.mediaType.toLowerCase()}/${media.tmdbId}`}
      className="group block"
    >
      <Card className="h-full overflow-hidden">
        <div className="aspect-2/3 overflow-hidden bg-muted">
          {media.posterPath ? (
            <img
              src={tmdbImage(media.posterPath, "w500") ?? undefined}
              alt={`${media.title} poster`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              No poster image
            </div>
          )}
        </div>
        <CardContent className="flex flex-col gap-2 p-3">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{type}</Badge>
            {media.isAnimated ? (
              <Badge variant="outline">Animated</Badge>
            ) : null}
          </div>
          <h2 className="line-clamp-2 font-heading font-semibold">
            {media.title}
          </h2>
          <div className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{year ?? "Year unavailable"}</span>
            <span>
              {media.voteAverage != null
                ? `TMDB ${media.voteAverage.toFixed(1)}`
                : "No rating"}
            </span>
          </div>
          {media.overview ? (
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {media.overview}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
