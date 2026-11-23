"use client";

import { useMemo, useState } from "react";
import {
  type BrowserCollection,
  CollectionGrid,
  filterByName,
} from "@/features/collections/components/collection-browser";
import {
  CollectionCard,
  imagePriorityFor,
} from "@/features/collections/components/collection-card";
import { CollectionSearch } from "@/features/collections/components/collection-search";

export function CollectionDiscovery({
  sections,
  searchPool,
}: {
  sections: { title: string; collections: BrowserCollection[] }[];
  searchPool: BrowserCollection[];
}) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? filterByName(searchPool, query) : []),
    [searchPool, query, searching],
  );
  const firstSectionTitle = sections.find(
    (section) => section.collections.length,
  )?.title;

  return (
    <div className="flex flex-col gap-6">
      <CollectionSearch value={query} onChange={setQuery} />
      {searching ? (
        <CollectionGrid collections={results} />
      ) : (
        <div className="flex flex-col gap-12">
          {sections.map(({ title, collections }) =>
            collections.length ? (
              <section key={title} className="flex flex-col gap-4">
                <h2 className="border-t border-foreground/10 pt-4 font-heading text-2xl font-medium">
                  {title}
                </h2>
                <div
                  aria-label={title}
                  className="grid auto-cols-[70%] grid-flow-col gap-6 overflow-x-auto pb-2 sm:auto-cols-[calc((100%_-_3rem)/3)] lg:auto-cols-[calc((100%_-_4.5rem)/4)]"
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
          )}
        </div>
      )}
    </div>
  );
}
