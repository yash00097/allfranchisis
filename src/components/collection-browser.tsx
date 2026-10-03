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
  coverImageUrl: string | null;
  _count: { media: number };
};

export function CollectionBrowser({
  collections,
}: {
  collections: Collection[];
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      ) : (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No collections found</EmptyTitle>
            <EmptyDescription>
              Try a different collection name.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
