import { Library } from "lucide-react";
import Link from "next/link";
import { CollectionBrowser } from "@/components/collection-browser";
import { GenreFilterBar } from "@/components/genre-filter-bar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCollections, listCollectionGenres } from "@/lib/collections";
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
  const [collections, genres] = await Promise.all([
    listCollections({ genre: activeGenre ?? undefined }),
    listCollectionGenres(),
  ]);

  const user = await getCurrentUser();
  const collectionIds = collections.map((collection) => collection.id);
  const [statuses, favorites] = user
    ? await Promise.all([
        getCollectionStatuses({ userId: user.id, collectionIds }),
        getCollectionFavorites({ userId: user.id, collectionIds }),
      ])
    : [new Map<string, WatchStatus>(), new Set<string>()];

  const collectionsWithStatus = collections.map((collection) => ({
    ...collection,
    status: statuses.get(collection.id) ?? null,
    isFavorite: user ? favorites.has(collection.id) : undefined,
  }));

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
      {collectionsWithStatus.length ? (
        <CollectionBrowser collections={collectionsWithStatus} />
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
