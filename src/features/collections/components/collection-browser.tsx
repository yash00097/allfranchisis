"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CollectionCard,
  imagePriorityFor,
} from "@/features/collections/components/collection-card";
import { CollectionSearch } from "@/features/collections/components/collection-search";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type BrowserCollection = {
  slug: string;
  name: string;
  description: string;
  genres: string[];
  coverImageUrl: string | null;
  _count: { media: number };
  status?: "WATCHING" | "WATCHED" | null;
  isFavorite?: boolean;
};

export function filterByName<T extends { name: string }>(
  collections: T[],
  query: string,
) {
  const normalized = query.trim().toLowerCase();
  return collections.filter((collection) =>
    collection.name.toLowerCase().includes(normalized),
  );
}

export function CollectionGrid({
  collections,
  emptyTitle = "No collections found",
  emptyDescription = "Try a different collection name.",
}: {
  collections: BrowserCollection[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return collections.length ? (
    <div className="grid items-start gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {collections.map((collection, index) => (
        <div key={collection.slug} className="mx-auto w-[70%] sm:w-full">
          <CollectionCard
            collection={collection}
            imagePriority={imagePriorityFor(index)}
          />
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
  );
}

/**
 * `searchPool` lets a filtered view (e.g. one genre) search beyond the
 * collections it shows; it defaults to `collections`.
 */
export function CollectionBrowser({
  collections,
  searchPool,
  emptyTitle,
  emptyDescription,
}: {
  collections: BrowserCollection[];
  searchPool?: BrowserCollection[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const visible = useMemo(
    () =>
      searching ? filterByName(searchPool ?? collections, query) : collections,
    [collections, searchPool, query, searching],
  );

  return (
    <div className="flex flex-col gap-6">
      <CollectionSearch value={query} onChange={setQuery} />
      <CollectionGrid
        collections={visible}
        {...(searching ? {} : { emptyTitle, emptyDescription })}
      />
    </div>
  );
}
