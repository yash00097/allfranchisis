import { Library } from "lucide-react";
import Link from "next/link";
import { CollectionBrowser } from "@/components/collection-browser";
import { CollectionDiscovery } from "@/components/collection-discovery";
import { GenreFilterBar } from "@/components/genre-filter-bar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listCollectionDiscovery,
  listCollections,
  listCollectionGenres,
} from "@/lib/collections";
import { isCollectionGenre } from "@/lib/collections/genres";
import { getCollectionFavorites } from "@/lib/favorites/queries";
import { getCollectionStatuses } from "@/lib/watch-status/queries";
import type { WatchStatus } from "@/lib/watch-status/types";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { genre: rawGenre } = await searchParams;
  const activeGenre = isCollectionGenre(rawGenre) ? rawGenre : null;
  const [user, genres] = await Promise.all([
    getCurrentUser(),
    listCollectionGenres(),
  ]);
  const [genreCollections, discovery] = await Promise.all([
    activeGenre ? listCollections({ genre: activeGenre }) : Promise.resolve([]),
    activeGenre
      ? Promise.resolve(null)
      : listCollectionDiscovery({ userId: user?.id }),
  ]);
  const discoveryCollections = discovery
    ? [
        ...discovery.userFavorites,
        ...discovery.recentlyUpdated,
        ...discovery.mostWatched,
      ]
    : [];
  const collections = activeGenre ? genreCollections : discoveryCollections;
  const uniqueCollections = Array.from(
    new Map(
      collections.map((collection) => [collection.id, collection]),
    ).values(),
  );
  const collectionIds = uniqueCollections.map((collection) => collection.id);
  const [statuses, favorites] = user
    ? await Promise.all([
        getCollectionStatuses({ userId: user.id, collectionIds }),
        getCollectionFavorites({ userId: user.id, collectionIds }),
      ])
    : [new Map<string, WatchStatus>(), new Set<string>()];

  const collectionsWithStatus = uniqueCollections.map((collection) => ({
    ...collection,
    status: statuses.get(collection.id) ?? null,
    isFavorite: user ? favorites.has(collection.id) : undefined,
  }));
  const collectionsById = new Map(
    collectionsWithStatus.map((collection) => [collection.id, collection]),
  );
  const discoverySections = discovery
    ? [
        {
          title: "Your favorites",
          collections: discovery.userFavorites,
        },
        {
          title: "Recently added & updated",
          collections: discovery.recentlyUpdated,
        },
        { title: "Most watched", collections: discovery.mostWatched },
      ].map((section) => ({
        ...section,
        collections: section.collections.flatMap((collection) => {
          const hydrated = collectionsById.get(collection.id);
          return hydrated ? [hydrated] : [];
        }),
      }))
    : [];
  const hasContent = activeGenre
    ? collectionsWithStatus.length > 0
    : discoverySections.some((section) => section.collections.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Explore
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          Collections
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse curated worlds across movies, television, and animation.
        </p>
      </header>
      <GenreFilterBar genres={genres} activeGenre={activeGenre} />
      {hasContent ? (
        activeGenre ? (
          <CollectionBrowser collections={collectionsWithStatus} />
        ) : (
          <CollectionDiscovery sections={discoverySections} />
        )
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Library />
            </EmptyMedia>
            <EmptyTitle>
              {activeGenre
                ? `No ${activeGenre} collections`
                : "No collections yet"}
            </EmptyTitle>
            <EmptyDescription>
              {activeGenre ? (
                <>
                  Nothing is tagged {activeGenre} right now.{" "}
                  <Link href="/collections" className="text-primary underline">
                    Show all collections
                  </Link>
                </>
              ) : (
                "Curated collections will appear here when they are published."
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </main>
  );
}
