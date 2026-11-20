import { auth } from "@clerk/nextjs/server";
import { CollectionBrowser } from "@/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionStatuses } from "@/lib/watch-status/queries";
import type { WatchStatus } from "@/lib/watch-status/types";
import { listUserWatchlistCollections } from "@/lib/watchlist/queries";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const collections = user
    ? await listUserWatchlistCollections({ userId: user.id })
    : [];
  const statuses = user
    ? await getCollectionStatuses({
        userId: user.id,
        collectionIds: collections.map((collection) => collection.id),
      })
    : new Map<string, WatchStatus>();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Your library
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Watchlist
        </h1>
        <p className="text-muted-foreground">
          Collections you want to watch later.
        </p>
      </header>
      <CollectionBrowser
        collections={collections.map((collection) => ({
          ...collection,
          status: statuses.get(collection.id) ?? null,
        }))}
        emptyTitle="Your watchlist is empty"
        emptyDescription="Click the bookmark on a collection to add it to your watchlist."
      />
    </main>
  );
}
