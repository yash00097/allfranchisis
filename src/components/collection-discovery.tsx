import { CollectionCard } from "@/components/collection-card";

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
  return sections.map(({ title, collections }) =>
    collections.length ? (
      <section key={title} className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <div
          aria-label={title}
          className="grid auto-cols-[70%] grid-flow-col gap-5 overflow-x-auto pb-2 sm:auto-cols-[calc((100%_-_2.5rem)/3)] lg:auto-cols-[calc((100%_-_3.75rem)/4)]"
          role="region"
        >
          {collections.slice(0, 4).map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      </section>
    ) : null,
  );
}
