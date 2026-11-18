"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CollectionCard, imagePriorityFor } from "@/components/collection-card";
import { CollectionSearch } from "@/components/collection-search";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

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

export function CollectionDiscovery({
  sections,
}: {
  sections: { title: string; collections: Collection[] }[];
}) {
  const [query, setQuery] = useState("");
  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sections.map((section) => ({
      ...section,
      collections: normalized
        ? section.collections.filter((collection) =>
            collection.name.toLowerCase().includes(normalized),
          )
        : section.collections,
    }));
  }, [sections, query]);
  const hasResults = filteredSections.some(
    (section) => section.collections.length > 0,
  );

  const firstSectionTitle = filteredSections.find(
    (section) => section.collections.length,
  )?.title;

  return (
    <>
      <CollectionSearch value={query} onChange={setQuery} />
      {hasResults ? (
        filteredSections.map(({ title, collections }) =>
          collections.length ? (
            <section key={title} className="flex flex-col gap-4">
              <h2 className="font-heading text-2xl font-semibold">{title}</h2>
              <div
                aria-label={title}
                className="grid auto-cols-[70%] grid-flow-col gap-5 overflow-x-auto pb-2 sm:auto-cols-[calc((100%_-_2.5rem)/3)] lg:auto-cols-[calc((100%_-_3.75rem)/4)]"
                role="region"
              >
                {collections.slice(0, 4).map((collection, index) => (
                  <CollectionCard
                    key={collection.slug}
                    collection={collection}
                    imagePriority={
                      title === firstSectionTitle
                        ? imagePriorityFor(index)
                        : "lazy"
                    }
                  />
                ))}
              </div>
            </section>
          ) : null,
        )
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
