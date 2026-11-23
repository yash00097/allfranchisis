import { auth } from "@clerk/nextjs/server";
import { PAGE_MAIN_CLASS, PageHeader } from "@/components/page-header";
import { CollectionBrowser } from "@/features/collections/components/collection-browser";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCollectionFavorites } from "@/features/library/favorites/queries";
import { listUserCollectionsByStatus } from "@/features/library/watch-status/queries";

export const dynamic = "force-dynamic";

export default async function WatchedPage() {
  await auth.protect();
  const user = await getCurrentUser();
  const collections = user
    ? await listUserCollectionsByStatus({
        userId: user.id,
        status: "WATCHED",
      })
    : [];
  const favorites = user
    ? await getCollectionFavorites({
        userId: user.id,
        collectionIds: collections.map((collection) => collection.id),
      })
    : new Set<string>();

  return (
    <main className={PAGE_MAIN_CLASS}>
      <PageHeader
        kicker="Your library"
        title="Completed"
        description="Collections you have finished"
      />
      <CollectionBrowser
        collections={collections.map((collection) => ({
          ...collection,
          status: "WATCHED" as const,
          isFavorite: favorites.has(collection.id),
        }))}
        emptyTitle="Nothing completed yet"
        emptyDescription="Open a collection and mark it as Completed to see it here."
      />
    </main>
  );
}
