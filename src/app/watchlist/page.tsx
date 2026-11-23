import { auth } from "@clerk/nextjs/server";
import { PAGE_MAIN_CLASS, PageHeader } from "@/components/page-header";
import { CollectionBrowser } from "@/features/collections/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionStatuses } from "@/features/library/watch-status/queries";
import type { WatchStatus } from "@/features/library/watch-status/types";
import { listUserWatchlistCollections } from "@/features/library/watchlist/queries";

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
    <main className={PAGE_MAIN_CLASS}>
      <PageHeader
        kicker="Your library"
        title="Watchlist"
        description="Collections you want to watch later"
      />
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
