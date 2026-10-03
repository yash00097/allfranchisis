"use client";

import {
  ArrowDownAZ,
  CalendarDays,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MediaCard } from "@/components/media-card";
import type { MediaType } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

const filters = [
  { value: "ALL", label: "All" },
  { value: "MOVIE", label: "Movies" },
  { value: "TV", label: "TV shows" },
  { value: "ANIMATED_MOVIE", label: "Animated movies" },
  { value: "ANIMATED_TV", label: "Animated series" },
] as const;

type Filter = (typeof filters)[number]["value"];
type Sort = "ORDER" | "ALPHABETICAL" | "RELEASE" | "RATING";

type Media = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string | null;
  posterPath: string | null;
  releaseDate: Date | null;
  voteAverage: number | null;
  isAnimated: boolean;
};

export function CollectionMediaBrowser({ media }: { media: Media[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("ORDER");
  const visibleMedia = useMemo(() => {
    const filtered = media.filter((item) => {
      if (filter === "ALL") return true;
      if (filter === "MOVIE") return item.mediaType === "MOVIE";
      if (filter === "TV") return item.mediaType === "TV";
      if (filter === "ANIMATED_MOVIE")
        return item.mediaType === "MOVIE" && item.isAnimated;
      return item.mediaType === "TV" && item.isAnimated;
    });

    return [...filtered].sort((left, right) => {
      if (sort === "ALPHABETICAL") return left.title.localeCompare(right.title);
      if (sort === "RELEASE")
        return (
          (right.releaseDate?.getTime() ?? 0) -
          (left.releaseDate?.getTime() ?? 0)
        );
      if (sort === "RATING")
        return (right.voteAverage ?? -1) - (left.voteAverage ?? -1);
      return 0;
    });
  }, [filter, media, sort]);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 border-y py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Media type filters">
          {filters.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-2"
          aria-label="Media sorting options"
        >
          <Button
            type="button"
            variant={sort === "ORDER" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSort("ORDER")}
            title="Collection order"
          >
            <SlidersHorizontal />
          </Button>
          <Button
            type="button"
            variant={sort === "ALPHABETICAL" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSort("ALPHABETICAL")}
            title="Sort alphabetically"
          >
            <ArrowDownAZ />
          </Button>
          <Button
            type="button"
            variant={sort === "RELEASE" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSort("RELEASE")}
            title="Sort by release date"
          >
            <CalendarDays />
          </Button>
          <Button
            type="button"
            variant={sort === "RATING" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSort("RATING")}
            title="Sort by TMDB rating"
          >
            <Star />
          </Button>
        </div>
      </div>
      {visibleMedia.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {visibleMedia.map((item) => (
            <MediaCard key={`${item.mediaType}-${item.tmdbId}`} media={item} />
          ))}
        </div>
      ) : (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyTitle>No media matches this filter</EmptyTitle>
            <EmptyDescription>Try another media type.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
