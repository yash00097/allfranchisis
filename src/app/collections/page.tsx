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
  const [user, genres, allCollections, discovery] = await Promise.all([
    getCurrentUser(),
    listCollectionGenres(),
    listCollections(),
    activeGenre ? null : listCollectionDiscovery(),
  ]);
  const collectionIds = allCollections.map((collection) => collection.id);
  const [statuses, favorites] = user
    ? await Promise.all([
        getCollectionStatuses({ userId: user.id, collectionIds }),
        getCollectionFavorites({ userId: user.id, collectionIds }),
      ])
    : [new Map<string, WatchStatus>(), new Set<string>()];

  // Search spans every collection, not just the genre or discovery rows shown.
  const searchPool = allCollections.map((collection) => ({
    ...collection,
    status: statuses.get(collection.id) ?? null,
    isFavorite: user ? favorites.has(collection.id) : undefined,
  }));
  const collectionsWithStatus = activeGenre
    ? searchPool.filter((collection) => collection.genres.includes(activeGenre))
    : [];
  const collectionsById = new Map(
    searchPool.map((collection) => [collection.id, collection]),
  );
  const discoverySections = discovery
    ? [
        {
          title: "Recently added & updated",
          collections: discovery.recentlyUpdated,
        },
        {
          title: "Most favorites",
          collections: discovery.mostFavorited,
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
          <CollectionBrowser
            collections={collectionsWithStatus}
            searchPool={searchPool}
          />
        ) : (
          <CollectionDiscovery
            sections={discoverySections}
            searchPool={searchPool}
          />
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
