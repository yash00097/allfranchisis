import { auth } from "@clerk/nextjs/server";
import { CollectionBrowser } from "@/features/collections/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionFavorites } from "@/features/library/favorites/queries";
import { listUserCollectionsByStatus } from "@/features/library/watch-status/queries";

export const dynamic = "force-dynamic";

export default async function WatchingPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const collections = user
    ? await listUserCollectionsByStatus({
        userId: user.id,
        status: "WATCHING",
      })
    : [];
  const favorites = user
    ? await getCollectionFavorites({
        userId: user.id,
        collectionIds: collections.map((collection) => collection.id),
      })
    : new Set<string>();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Your library
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          In Progress
        </h1>
        <p className="text-muted-foreground">
          Collections you are currently working through.
        </p>
      </header>
      <CollectionBrowser
        collections={collections.map((collection) => ({
          ...collection,
          status: "WATCHING" as const,
          isFavorite: favorites.has(collection.id),
        }))}
        emptyTitle="Nothing in progress"
        emptyDescription="Open a collection and mark it as In Progress to see it here."
      />
    </main>
  );
}
