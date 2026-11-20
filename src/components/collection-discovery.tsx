"use client";

import { useMemo, useState } from "react";
import {
  type BrowserCollection,
  CollectionGrid,
  filterByName,
} from "@/components/collection-browser";
import { CollectionCard, imagePriorityFor } from "@/components/collection-card";
import { CollectionSearch } from "@/components/collection-search";

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
    <>
      <CollectionSearch value={query} onChange={setQuery} />
      {searching ? (
        <CollectionGrid collections={results} />
      ) : (
        sections.map(({ title, collections }) =>
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
      )}
    </>
  );
}
