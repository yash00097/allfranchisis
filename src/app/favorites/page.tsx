import { auth } from "@clerk/nextjs/server";
import { PAGE_MAIN_CLASS, PageHeader } from "@/components/page-header";
import { CollectionBrowser } from "@/features/collections/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listUserFavoriteCollections } from "@/features/library/favorites/queries";
import { getCollectionStatuses } from "@/features/library/watch-status/queries";
import type { WatchStatus } from "@/features/library/watch-status/types";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const collections = user
    ? await listUserFavoriteCollections({ userId: user.id })
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
        title="Favorites"
        description="Collections you marked with a heart"
      />
      <CollectionBrowser
        collections={collections.map((collection) => ({
          ...collection,
          status: statuses.get(collection.id) ?? null,
          isFavorite: true,
        }))}
        emptyTitle="No favorites yet"
        emptyDescription="Click the heart on a collection to add it to your favorites."
      />
    </main>
  );
}
