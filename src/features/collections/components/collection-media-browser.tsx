"use client";

import { cn } from "cn";
import { ArrowDownAZ, CalendarDays, ListOrdered, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { MediaCard } from "@/features/media/components/media-card";
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

const sorts = [
  { value: "ORDER", label: "Collection order", icon: ListOrdered },
  { value: "ALPHABETICAL", label: "Sort alphabetically", icon: ArrowDownAZ },
  { value: "RELEASE", label: "Sort by release date", icon: CalendarDays },
  { value: "RATING", label: "Sort by TMDB rating", icon: Star },
] as const;

type Filter = (typeof filters)[number]["value"];
type Sort = (typeof sorts)[number]["value"];

type Media = {
  displayKey: string;
  displayOrder: number;
  seasonLabel: string | null;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string | null;
  posterPath: string | null;
  releaseDate: Date | null;
  voteAverage: number | null;
  isAnimated: boolean;
};

export function CollectionMediaBrowser({
  media,
  collectionSlug,
}: {
  media: Media[];
  collectionSlug: string;
}) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("ORDER");
  // `media` arrives in watch order, so the index is each title's position in it.
  const positions = useMemo(
    () => new Map(media.map((item, index) => [item.displayKey, index + 1])),
    [media],
  );
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-y border-foreground/10 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Media type filters"
        >
          {filters.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Sort media"
        >
          {sorts.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              aria-pressed={sort === value}
              title={label}
              onClick={() => setSort(value)}
              className={cn(
                "text-muted-foreground",
                sort === value && "bg-muted text-foreground",
              )}
            >
              <Icon />
            </Button>
          ))}
        </div>
      </div>
      {visibleMedia.length ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 xl:grid-cols-5">
          {visibleMedia.map((item) => (
            <MediaCard
              key={item.displayKey}
              media={item}
              position={positions.get(item.displayKey)}
              collectionSlug={collectionSlug}
            />
          ))}
        </div>
      ) : (
        <Empty className="min-h-64 border border-foreground/10">
          <EmptyHeader>
            <EmptyTitle>No titles match this filter</EmptyTitle>
            <EmptyDescription>Try another media type.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
