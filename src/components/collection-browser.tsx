"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CollectionCard } from "@/components/collection-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";

type Collection = {
  slug: string;
  name: string;
  description: string;
  genres: string[];
  coverImageUrl: string | null;
  _count: { media: number };
  status?: "WATCHING" | "WATCHED" | null;
  isFavorite?: boolean;
};

export function CollectionBrowser({
  collections,
  emptyTitle = "No collections found",
  emptyDescription = "Try a different collection name.",
}: {
  collections: Collection[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const filteredCollections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? collections.filter((collection) =>
          collection.name.toLowerCase().includes(normalized),
        )
      : collections;
  }, [collections, query]);

  return (
    <>
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search collections"
          className="pl-9"
          aria-label="Search collections"
        />
      </div>
      {filteredCollections.length ? (
        <div className="grid items-start gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCollections.map((collection) => (
            <div key={collection.slug} className="mx-auto w-[70%] sm:w-full">
              <CollectionCard collection={collection} />
            </div>
          ))}
        </div>
      ) : (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
